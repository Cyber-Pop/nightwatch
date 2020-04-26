import { Role } from 'discord.js'
import { CommandMessage } from 'discord.js-commando'
import { GuildService } from '../../services'
import { Command } from '../../base'
import { Client } from '../../models'

export default class DeleteSelfAssignableRoleCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'dsar',
      group: 'roles',
      memberName: 'dsar',
      description: 'Delete a self assignable role.',
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3
      },
      args: [
        {
          key: 'role',
          prompt: 'What role should I delete?\n',
          type: 'role|string'
        }
      ]
    })
  }

  public hasPermission(msg: CommandMessage) {
    return msg.member.permissions.has('MANAGE_ROLES')
  }

  public async run(msg: CommandMessage, args: any) {
    const role: Role =
      args.role instanceof Role
        ? args.role
        : msg.guild.roles.find(
            x => x.name.toLowerCase() === args.role.toLowerCase().trim()
          )

    if (!role) {
      return msg.reply(`Could not find a role named ${args.role}`)
    }

    if (
      role.position >= msg.member.highestRole.position &&
      msg.member.id !== msg.guild.owner.id
    ) {
      return msg.reply('You cannot remove that role as a self assignable role.')
    }

    const guildService = new GuildService()

    try {
      await guildService.deleteSelfAssignableRole(msg.guild.id, role.id)
    } catch {
      return msg.reply('Failed to delete self assignable role. Does it exist?')
    }

    return msg.channel.send(
      `Successfully removed **${role.name}** as a self assignable role!`
    )
  }
}
