import cricketApiService, { CricApiMatch } from './cricketApiService';
import Match, { IMatch } from '../models/Match';

class MatchSyncService {

  // Transform CricAPI match → plain object for Match.create()
  private transformMatch(apiMatch: CricApiMatch): Record<string, unknown> {
    const t1 = apiMatch.teamInfo?.[0] ?? { name: apiMatch.teams?.[0] ?? 'Team A', shortname: 'TMA', img: '' };
    const t2 = apiMatch.teamInfo?.[1] ?? { name: apiMatch.teams?.[1] ?? 'Team B', shortname: 'TMB', img: '' };

    return {
      teams: [
        { name: t1.name, shortName: t1.shortname, flagUrl: t1.img ?? '' },
        { name: t2.name, shortName: t2.shortname, flagUrl: t2.img ?? '' },
      ],
      date:       new Date(apiMatch.dateTimeGMT || apiMatch.date),
      venue:      apiMatch.venue || 'TBA',
      city:       extractCity(apiMatch.venue || ''),
      format:     cricketApiService.normalizeFormat(apiMatch.matchType),
      status:     cricketApiService.normalizeStatus(apiMatch),
      externalId: apiMatch.id,
      seriesName: apiMatch.name?.split(',')[1]?.trim() ?? '',
      isAdded:    false,
    };
  }

  // Sync fresh matches from CricAPI into MongoDB
  async syncCurrentMatches(): Promise<{ created: number; updated: number }> {
    console.log('🔄 Syncing matches from CricAPI...');
    let created = 0;
    let updated = 0;

    try {
      const apiMatches = await cricketApiService.getCurrentMatches();

      for (const apiMatch of apiMatches) {
        const data     = this.transformMatch(apiMatch);
        const existing = await Match.findOne({ externalId: apiMatch.id });

        if (existing) {
          await Match.findByIdAndUpdate(existing._id, {
            status:     data['status'],
            seriesName: data['seriesName'],
          });
          updated++;
        } else {
          await Match.create(data);
          created++;
        }
      }

      console.log(`✅ Match sync complete: ${created} created, ${updated} updated`);
    } catch (err) {
      console.error('❌ Match sync failed:', err);
    }

    return { created, updated };
  }

  // Get all upcoming matches (DB first, sync if empty)
  async getUpcomingMatches(limit = 20): Promise<IMatch[]> {
    let matches = await Match.find({
      status: { $in: ['upcoming', 'live'] },
      date:   { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    }).sort({ date: 1 }).limit(limit).lean();

    if (matches.length === 0) {
      await this.syncCurrentMatches();
      matches = await Match.find({ status: { $in: ['upcoming', 'live'] } })
        .sort({ date: 1 }).limit(limit).lean();
    }

    return matches as unknown as IMatch[];
  }

  // Seed mock matches into DB (development only)
  async seedMockMatches(): Promise<number> {
    const { getMockMatches } = await import('./cricketApiService');
    const mocks = getMockMatches();
    let count = 0;

    for (const m of mocks) {
      const exists = await Match.findOne({ externalId: m.id });
      if (!exists) {
        await Match.create(this.transformMatch(m));
        count++;
      }
    }

    console.log(`🌱 Seeded ${count} mock matches`);
    return count;
  }
}

function extractCity(venue: string): string {
  const parts = venue.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : venue.trim();
}

const matchSyncService = new MatchSyncService();
export default matchSyncService;
