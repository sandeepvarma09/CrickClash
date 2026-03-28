"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cricketApiService_1 = __importDefault(require("./cricketApiService"));
const Match_1 = __importDefault(require("../models/Match"));
class MatchSyncService {
    // Transform CricAPI match → plain object for Match.create()
    transformMatch(apiMatch) {
        const t1 = apiMatch.teamInfo?.[0] ?? { name: apiMatch.teams?.[0] ?? 'Team A', shortname: 'TMA', img: '' };
        const t2 = apiMatch.teamInfo?.[1] ?? { name: apiMatch.teams?.[1] ?? 'Team B', shortname: 'TMB', img: '' };
        return {
            teams: [
                { name: t1.name, shortName: t1.shortname, flagUrl: t1.img ?? '' },
                { name: t2.name, shortName: t2.shortname, flagUrl: t2.img ?? '' },
            ],
            date: new Date(apiMatch.dateTimeGMT || apiMatch.date),
            venue: apiMatch.venue || 'TBA',
            city: extractCity(apiMatch.venue || ''),
            format: cricketApiService_1.default.normalizeFormat(apiMatch.matchType),
            status: cricketApiService_1.default.normalizeStatus(apiMatch),
            externalId: apiMatch.id,
            seriesName: apiMatch.name?.split(',')[1]?.trim() ?? '',
            isAdded: false,
        };
    }
    // Sync fresh matches from CricAPI into MongoDB
    async syncCurrentMatches() {
        console.log('🔄 Syncing matches from CricAPI...');
        let created = 0;
        let updated = 0;
        try {
            const apiMatches = await cricketApiService_1.default.getCurrentMatches();
            for (const apiMatch of apiMatches) {
                const data = this.transformMatch(apiMatch);
                const existing = await Match_1.default.findOne({ externalId: apiMatch.id });
                if (existing) {
                    await Match_1.default.findByIdAndUpdate(existing._id, {
                        status: data['status'],
                        seriesName: data['seriesName'],
                    });
                    updated++;
                }
                else {
                    await Match_1.default.create(data);
                    created++;
                }
            }
            console.log(`✅ Match sync complete: ${created} created, ${updated} updated`);
        }
        catch (err) {
            console.error('❌ Match sync failed:', err);
        }
        return { created, updated };
    }
    // Get all upcoming matches (DB first, sync if empty)
    async getUpcomingMatches(limit = 20) {
        let matches = await Match_1.default.find({
            status: { $in: ['upcoming', 'live'] },
            date: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
        }).sort({ date: 1 }).limit(limit).lean();
        if (matches.length === 0) {
            await this.syncCurrentMatches();
            matches = await Match_1.default.find({ status: { $in: ['upcoming', 'live'] } })
                .sort({ date: 1 }).limit(limit).lean();
        }
        return matches;
    }
    // Seed mock matches into DB (development only)
    async seedMockMatches() {
        const { getMockMatches } = await Promise.resolve().then(() => __importStar(require('./cricketApiService')));
        const mocks = getMockMatches();
        let count = 0;
        for (const m of mocks) {
            const exists = await Match_1.default.findOne({ externalId: m.id });
            if (!exists) {
                await Match_1.default.create(this.transformMatch(m));
                count++;
            }
        }
        console.log(`🌱 Seeded ${count} mock matches`);
        return count;
    }
}
function extractCity(venue) {
    const parts = venue.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : venue.trim();
}
const matchSyncService = new MatchSyncService();
exports.default = matchSyncService;
