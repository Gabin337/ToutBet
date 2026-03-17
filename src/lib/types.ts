export type Role = 'user' | 'admin';
export type Outcome = 'yes' | 'no';
export type MarketStatus = 'open' | 'resolved';

export type TokenPair = {
  access_token: string;
  token_type: 'bearer';
};

export type User = {
  id: number;
  email: string;
  role: Role;
  balance_tokens: number;
};

export type Market = {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  status: MarketStatus;
  resolved_outcome: Outcome | null;
  yes_pool: number;
  no_pool: number;
  created_at: string;
  prob_yes: number;
  prob_no: number;
};

export type Bet = {
  id: number;
  user_id: number;
  market_id: number;
  side: Outcome;
  amount_tokens: number;
  created_at: string;
  settled: boolean;
  won: boolean | null;
  payout_tokens: number | null;
};

export type MyBet = {
  bet: Bet;
  market: Market;
};

