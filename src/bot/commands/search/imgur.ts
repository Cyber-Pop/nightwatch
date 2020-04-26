import { CommandMessage } from 'discord.js-commando'
import axios from 'axios'
import { Config } from '../../../common'
import { TextChannel } from 'discord.js'
const config: Config = require('../../../../config/config.json')
import { Command } from '../../base'
import { Client } from '../../models'

export default class ImgurCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'imgur',
      group: 'search',
      memberName: 'imgur',
      aliases: ['img'],
      description: 'Searches Imgur for an image.',
      args: [
        {
          key: 'query',
          prompt: 'What image would you like to search for?\n',
          type: 'string'
        }
      ]
    })
  }

  public async run(msg: CommandMessage, args: any) {
    if (!config.optional || !config.optional.imgur) {
      return msg.reply(
        'Command failed. Bot owner has not configured the bot with an Imgur API key.'
      )
    }

    const query = args.query as string

    interface Album {
      readonly link: string
      readonly nsfw: boolean
      readonly images: ReadonlyArray<Image>
      readonly is_album: boolean
    }

    interface Image {
      readonly link: string
      readonly nsfw: boolean
      readonly is_album: boolean
    }

    const {
      data: { data: albums }
    }: {
      readonly data: { readonly data: ReadonlyArray<Album> }
    } = await axios.get(
      `https://api.imgur.com/3/gallery/search?q=${encodeURI(query)}`,
      {
        headers: {
          Authorization: `Client-ID ${config.optional.imgur.clientId}`
        }
      }
    )

    const filteredAlbums = albums.filter(
      album => album && ((msg.channel as TextChannel).nsfw ? true : !album.nsfw)
    )

    if (!filteredAlbums.length) {
      return msg.reply('No results found.')
    }

    const randomAlbum =
      filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)]

    if (!randomAlbum.images) {
      if (randomAlbum.is_album) {
        return msg.reply('Command failed. Try again.')
      }

      return msg.channel.send(randomAlbum.link)
    }

    const filteredImages = randomAlbum.images.filter(
      image => image && ((msg.channel as TextChannel).nsfw ? true : !image.nsfw)
    )

    if (!filteredImages || !filteredImages.length) {
      return msg.reply('No results found.')
    }

    return msg.channel.send(filteredImages[0].link)
  }
}
