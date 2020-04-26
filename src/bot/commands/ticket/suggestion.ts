import { Message, RichEmbed, TextChannel } from 'discord.js'
import { CommandMessage } from 'discord.js-commando'
import { oneLine } from 'common-tags'
import { GuildSuggestion } from '../../../db'
import { GuildService } from '../../services'
import { Command } from '../../base'
import { Client } from '../../models'

export default class SuggestionCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'suggest',
      group: 'ticket',
      memberName: 'suggest',
      description: 'Create a suggestion that people can vote on.',
      details: `Create a suggestion that people can vote on.

        The supported actions:
        __suggest create <description>:__ Creates a suggestion.
        __suggest edit <ID>:__ Edits your suggestion.`,
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3
      },
      args: [
        {
          key: 'action',
          prompt: 'What do you want to do?\n',
          type: 'string',
          default: 'create',
          parse: (str: string) => str.toLowerCase()
        },
        {
          key: 'suggestion',
          prompt: 'What do you suggest?\n',
          type: 'string'
        }
      ]
    })
  }

  public async run(msg: CommandMessage, args: any) {
    const {
      action,
      suggestion
    }: { readonly action: string; readonly suggestion: string } = args

    switch (action.trim().toLowerCase()) {
      case 'create':
        return this.createSuggestion(msg, suggestion)
      case 'edit':
        return this.editSuggestion(msg, suggestion)
      default:
        return this.createSuggestion(
          msg,
          action.charAt(0).toUpperCase() +
            action.substring(1) +
            (suggestion ? ' ' + suggestion : '')
        )
    }
  }

  private async createSuggestion(msg: CommandMessage, suggestion: string) {
    const channel = msg.guild.channels.find(
      x => x.name === 'suggestions' && x.type === 'text'
    )

    if (!channel) {
      return msg.reply(
        oneLine`Unable to find suggestions channel.
          If you are an admin, please create a #suggestions text channel.`
      )
    }

    const guildService = new GuildService()

    const guild = await guildService.find(msg.guild.id)

    if (!guild) {
      return msg.reply(
        oneLine`This guild does not exist in my database.
          An entry has been created. Please try the command again.`
      )
    }

    const embed = new RichEmbed()

    embed
      .setAuthor('New Suggestion')
      .setColor(msg.member ? msg.member.displayHexColor : '#ff0000')
      .setFooter('Like it? 👍 or 👎')
      .addField('Suggested By', msg.member, true)
      .addField('Description', suggestion)
      .setTimestamp(new Date())

    const textChannel = channel as TextChannel

    textChannel
      .send(embed)
      .then(async (m: Message | ReadonlyArray<Message>) => {
        const suggestionMessage = m as Message
        const dbSuggestion = new GuildSuggestion()
        dbSuggestion.color = msg.member ? msg.member.displayHexColor : '#ff0000'
        dbSuggestion.description = suggestion
        dbSuggestion.dislikes = 0
        dbSuggestion.likes = 0
        dbSuggestion.guild = guild
        dbSuggestion.userId = msg.author.id
        dbSuggestion.messageId = suggestionMessage.id

        const ticket = await guildService.createSuggestion(
          msg.guild.id,
          dbSuggestion
        )

        const editedEmbed = new RichEmbed()

        editedEmbed
          .setAuthor('New Suggestion')
          .setColor(msg.member ? msg.member.displayHexColor : '#ff0000')
          .setFooter('Like it? 👍 or 👎')
          .addField('ID', ticket.id, true)
          .addField('Suggested By', msg.member, true)
          .addField('Description', suggestion)
          .setTimestamp(new Date())

        await suggestionMessage.edit(editedEmbed)
        await suggestionMessage.react('👍')
        await suggestionMessage.react('👎')
        return undefined
      })
      .catch((err: Error) => {
        console.error(err)
        return msg.channel.send('Error occurred while creating suggestion.')
      })

    return msg.reply(
      `Your suggestion has been added. Check it out in ${channel}`
    )
  }
  private async editSuggestion(msg: CommandMessage, description: string) {
    const channel = msg.guild.channels.find(
      x => x.name === 'suggestions' && x.type === 'text'
    )

    if (!channel) {
      return msg.reply(
        oneLine`Unable to find suggestions channel.
          If you are an admin, please create a #suggestions text channel.`
      )
    }

    const guildService = new GuildService()

    const guild = await guildService.find(msg.guild.id)

    if (!guild) {
      return msg.reply(
        oneLine`This guild does not exist in my database.
          An entry has been created. Please try the command again.`
      )
    }

    const suggestions = guild.suggestions || []

    const suggestionId = Number(
      description.substring(0, description.indexOf(' ')).trim()
    )
    const suggestion = suggestions.find(x => x.id === suggestionId)

    if (!suggestion) {
      return msg.reply(`Suggestion ${suggestionId} not found.`)
    }

    const isSuggestionOwner = msg.member.id === suggestion.userId

    const newDescription = description
      .substring(description.indexOf(' '))
      .trim()

    if (!isSuggestionOwner && !msg.member.hasPermission('MANAGE_MESSAGES')) {
      return msg.reply("You don't have permission to do that.")
    }

    const messages = (channel as TextChannel).messages

    const originalMessage = messages.find(x => x.id === suggestion.messageId)

    if (!originalMessage) {
      return msg.reply(
        `Unable to find message ${suggestion.messageId} in ${channel}.`
      )
    }

    const newEmbed = new RichEmbed()

    newEmbed
      .setAuthor('New Suggestion')
      .setColor(suggestion.color)
      .setFooter('Like it? 👍 or 👎')
      .addField('ID', suggestion.id, true)
      .addField('Suggested By', msg.guild.members.get(suggestion.userId), true)
      .addField('Description', newDescription)
      .setTimestamp(new Date(suggestion.dateCreated))

    suggestion.description = newDescription

    await guildService.updateSuggestion(msg.guild.id, suggestionId, suggestion)

    if (!originalMessage.editable) {
      return msg.reply('Message not editable.')
    }

    await originalMessage.edit(newEmbed)

    return msg.reply('Edit successful.')
  }
}
