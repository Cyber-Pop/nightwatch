import { CommandMessage } from 'discord.js-commando'
import { UserService } from '../../services'
import { Command } from '../../base'
import { Client } from '../../models'

export default class CreditsCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'credits',
      group: 'economy',
      memberName: 'credits',
      aliases: ['balance', 'bal'],
      description: 'Check how many credits you or someone else has.',
      guildOnly: false,
      throttling: {
        usages: 2,
        duration: 3
      },
      args: [
        {
          key: 'user',
          prompt: 'Whose credits would you like to view?\n',
          type: 'member',
          default: ''
        }
      ]
    })
  }

  public async run(msg: CommandMessage, args: any) {
    const userService = new UserService()
    const userId = args.user ? args.user.id : msg.author.id
    const userName = args.user ? args.user.displayName : msg.author.username

    const user = await userService
      .find(userId)
      .catch(_ => userService.create(args.user))
      .catch(() => {
        // swallow
      })

    const credits = user ? user.balance.balance : 0
    const dollarEmoji = '💵'

    return msg.channel.send(
      `${userName} has ${dollarEmoji} ${credits} credits.`
    )
  }
}
