import { GuildMember } from 'discord.js'
import { CommandMessage } from 'discord.js-commando'
import { UserService } from '../../services'
import { UserLevelBalance } from '../../../api/src/models'
import { Command } from '../../base'
import { Client } from '../../models'

export default class GiveXpCommand extends Command {
  public readonly premiumOnly: true

  constructor(client: Client) {
    super(client, {
      name: 'givexp',
      group: 'debug',
      memberName: 'givexp',
      description: 'Give a user xp.',
      guildOnly: false,
      throttling: {
        usages: 2,
        duration: 3
      },
      args: [
        {
          key: 'member',
          prompt: 'Who should I give xp to?\n',
          type: 'member'
        },
        {
          key: 'amount',
          prompt: 'How much xp should I give?\n',
          type: 'integer'
        }
      ],
      ownerOnly: true
    })
  }

  public async run(msg: CommandMessage, args: any) {
    const userService = new UserService()

    const member = args.member as GuildMember
    const amount = args.amount as number

    const user = await userService.find(member.id)

    if (!user) {
      return msg.reply('Unable to find that user in my database.')
    }

    user.level.xp += amount

    await userService.updateLevelBalance(member.id, {
      level: user.level
    } as UserLevelBalance)

    return msg.reply('Updated user xp.')
  }
}
