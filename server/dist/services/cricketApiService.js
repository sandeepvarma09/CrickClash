"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockMatches = getMockMatches;
exports.getMockPlayers = getMockPlayers;
const axios_1 = __importDefault(require("axios"));
// ─── Cricket API Service ───────────────────────────────────────────────────────
class CricketApiService {
    constructor() {
        this.baseURL = 'https://api.cricapi.com/v1';
        this.apiKey = process.env.CRICKET_API_KEY || '';
        this.client = axios_1.default.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
        });
        // Request logger in dev
        if (process.env.NODE_ENV === 'development') {
            this.client.interceptors.request.use((config) => {
                console.log(`🏏 CricAPI → ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            });
        }
    }
    get hasApiKey() {
        return !!this.apiKey && this.apiKey !== 'your_cricapi_key_here';
    }
    // ─── Fetch upcoming & current matches ───────────────────────────────────────
    async getCurrentMatches(offset = 0) {
        if (!this.hasApiKey) {
            console.warn('⚠️  No Cricket API key — returning mock data');
            return getMockMatches();
        }
        try {
            const res = await this.client.get(`/currentMatches?apikey=${this.apiKey}&offset=${offset}`);
            return res.data.data || [];
        }
        catch (err) {
            console.error('❌ CricAPI getCurrentMatches error:', err);
            return getMockMatches();
        }
    }
    // ─── Fetch upcoming scheduled matches ───────────────────────────────────────
    async getUpcomingMatches(offset = 0) {
        if (!this.hasApiKey)
            return getMockMatches();
        try {
            const res = await this.client.get(`/matches?apikey=${this.apiKey}&offset=${offset}`);
            return (res.data.data || []).filter((m) => !m.matchStarted && !m.matchEnded);
        }
        catch (err) {
            console.error('❌ CricAPI getUpcomingMatches error:', err);
            return getMockMatches();
        }
    }
    // ─── Fetch single match info ─────────────────────────────────────────────────
    async getMatchById(externalId) {
        if (!this.hasApiKey) {
            const mocks = getMockMatches();
            return mocks.find((m) => m.id === externalId) || null;
        }
        try {
            const res = await this.client.get(`/match_info?apikey=${this.apiKey}&id=${externalId}`);
            return res.data.data || null;
        }
        catch (err) {
            console.error('❌ CricAPI getMatchById error:', err);
            return null;
        }
    }
    // ─── Search players by name ──────────────────────────────────────────────────
    async searchPlayers(name) {
        if (!this.hasApiKey)
            return getMockPlayers(name);
        try {
            const res = await this.client.get(`/players?apikey=${this.apiKey}&offset=0&search=${encodeURIComponent(name)}`);
            return res.data.data || [];
        }
        catch (err) {
            console.error('❌ CricAPI searchPlayers error:', err);
            return getMockPlayers(name);
        }
    }
    // ─── Normalize match format string ──────────────────────────────────────────
    normalizeFormat(type) {
        const t = type.toLowerCase();
        if (t.includes('t20'))
            return 'T20';
        if (t.includes('odi') || t.includes('one day'))
            return 'ODI';
        if (t.includes('test'))
            return 'Test';
        if (t.includes('t10'))
            return 'T10';
        return 'T20';
    }
    // ─── Normalize match status ──────────────────────────────────────────────────
    normalizeStatus(match) {
        if (match.matchEnded)
            return 'completed';
        if (match.matchStarted)
            return 'live';
        const status = match.status?.toLowerCase() || '';
        if (status.includes('won') || status.includes('draw') || status.includes('tied'))
            return 'completed';
        if (status === 'match not started')
            return 'upcoming';
        return 'upcoming';
    }
}
// ─── Mock Data (used when no API key is configured) ───────────────────────────
function getMockMatches() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    return [
        {
            id: 'mock-ind-aus-001',
            name: 'India vs Australia, 1st T20I',
            matchType: 'T20',
            status: 'Match not started',
            venue: 'Wankhede Stadium',
            date: tomorrow.toISOString().split('T')[0],
            dateTimeGMT: tomorrow.toISOString(),
            teams: ['India', 'Australia'],
            teamInfo: [
                { name: 'India', shortname: 'IND', img: '' },
                { name: 'Australia', shortname: 'AUS', img: '' },
            ],
            matchStarted: false,
            matchEnded: false,
        },
        {
            id: 'mock-pak-eng-002',
            name: 'Pakistan vs England, 2nd ODI',
            matchType: 'odi',
            status: 'Match not started',
            venue: 'Gaddafi Stadium',
            date: dayAfter.toISOString().split('T')[0],
            dateTimeGMT: dayAfter.toISOString(),
            teams: ['Pakistan', 'England'],
            teamInfo: [
                { name: 'Pakistan', shortname: 'PAK', img: '' },
                { name: 'England', shortname: 'ENG', img: '' },
            ],
            matchStarted: false,
            matchEnded: false,
        },
        {
            id: 'mock-sa-nz-003',
            name: 'South Africa vs New Zealand, 1st Test',
            matchType: 'test',
            status: 'Match not started',
            venue: 'Newlands Cricket Ground',
            date: in3Days.toISOString().split('T')[0],
            dateTimeGMT: in3Days.toISOString(),
            teams: ['South Africa', 'New Zealand'],
            teamInfo: [
                { name: 'South Africa', shortname: 'SA', img: '' },
                { name: 'New Zealand', shortname: 'NZ', img: '' },
            ],
            matchStarted: false,
            matchEnded: false,
        },
        {
            id: 'mock-ipl-csk-mi-004',
            name: 'CSK vs MI, IPL 2025 Match 12',
            matchType: 'T20',
            status: 'Match not started',
            venue: 'MA Chidambaram Stadium',
            date: tomorrow.toISOString().split('T')[0],
            dateTimeGMT: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString(),
            teams: ['Chennai Super Kings', 'Mumbai Indians'],
            teamInfo: [
                { name: 'Chennai Super Kings', shortname: 'CSK', img: '' },
                { name: 'Mumbai Indians', shortname: 'MI', img: '' },
            ],
            matchStarted: false,
            matchEnded: false,
        },
        {
            id: 'mock-ipl-rcb-kkr-005',
            name: 'RCB vs KKR, IPL 2025 Match 13',
            matchType: 'T20',
            status: 'Match not started',
            venue: 'M Chinnaswamy Stadium',
            date: dayAfter.toISOString().split('T')[0],
            dateTimeGMT: new Date(dayAfter.getTime() + 4 * 60 * 60 * 1000).toISOString(),
            teams: ['Royal Challengers Bengaluru', 'Kolkata Knight Riders'],
            teamInfo: [
                { name: 'Royal Challengers Bengaluru', shortname: 'RCB', img: '' },
                { name: 'Kolkata Knight Riders', shortname: 'KKR', img: '' },
            ],
            matchStarted: false,
            matchEnded: false,
        },
    ];
}
function getMockPlayers(search = '') {
    const players = [
        { id: 'p1', name: 'Virat Kohli', role: 'Batsman', country: 'India' },
        { id: 'p2', name: 'Rohit Sharma', role: 'Batsman', country: 'India' },
        { id: 'p3', name: 'Jasprit Bumrah', role: 'Bowler', country: 'India' },
        { id: 'p4', name: 'Hardik Pandya', role: 'All-rounder', country: 'India' },
        { id: 'p5', name: 'Shubman Gill', role: 'Batsman', country: 'India' },
        { id: 'p6', name: 'Steve Smith', role: 'Batsman', country: 'Australia' },
        { id: 'p7', name: 'Pat Cummins', role: 'Bowler', country: 'Australia' },
        { id: 'p8', name: 'David Warner', role: 'Batsman', country: 'Australia' },
        { id: 'p9', name: 'Joe Root', role: 'Batsman', country: 'England' },
        { id: 'p10', name: 'Ben Stokes', role: 'All-rounder', country: 'England' },
        { id: 'p11', name: 'Babar Azam', role: 'Batsman', country: 'Pakistan' },
        { id: 'p12', name: 'Shaheen Afridi', role: 'Bowler', country: 'Pakistan' },
        { id: 'p13', name: 'MS Dhoni', role: 'Wicketkeeper', country: 'India' },
        { id: 'p14', name: 'Suryakumar Yadav', role: 'Batsman', country: 'India' },
        { id: 'p15', name: 'Ravindra Jadeja', role: 'All-rounder', country: 'India' },
    ];
    if (!search)
        return players;
    return players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
}
// ─── Singleton Export ──────────────────────────────────────────────────────────
const cricketApiService = new CricketApiService();
exports.default = cricketApiService;
