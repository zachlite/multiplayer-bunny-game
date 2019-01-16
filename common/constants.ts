export const FRAME = 8; // ms
export const LATENCY = process.env.NODE_ENV === "production" ? 0 : 15; //ms, one-way
export const PLAYERS_PER_PARTY = 4;
export const FRAME_BUFFER = 4; // wait 4 frames before processing input
