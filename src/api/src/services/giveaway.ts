import { Giveaway } from '../../../db'
import { getRepository } from 'typeorm'
import { injectable } from 'inversify'
import { GiveawayService as IGiveawayService } from '../interfaces'

/**
 * Giveaway service that handles storing and modifying giveaway data.
 *
 * @class GiveawayService
 */
@injectable()
export class GiveawayService implements IGiveawayService {
  private giveawayRepository = getRepository(Giveaway)

  public find () {
    return this.giveawayRepository.find({ relations: ['items'] })
  }

  public async findById (id: number) {
    return this.giveawayRepository.findOne(id, { relations: ['items'] })
  }

  public async create (giveaway: Giveaway) {
    giveaway.dateCreated = new Date()
    await this.giveawayRepository.save(giveaway)
  }

  public async update (_: number, giveaway: Giveaway) {
    await this.giveawayRepository.save(giveaway)
  }

  public async delete (id: number) {
    const giveaway = await this.giveawayRepository.findOne(id)

    if (!giveaway) {
      return
    }

    await this.giveawayRepository.remove(giveaway)
  }
}
