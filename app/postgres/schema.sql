SET TIME ZONE 'UTC';

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR NOT NULL,
  password VARCHAR,
  user_id_42 INTEGER UNIQUE NOT NULL DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  avatar VARCHAR DEFAULT '/uploads/default.webp',
  totp_secret VARCHAR,
  prefered_mode SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX users_username_idx ON users (username);
CREATE INDEX users_user_id_42_idx ON users (user_id_42);

CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status SMALLINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (status >= 0 AND status <= 2)
);

CREATE INDEX friendships_sender_id_status_idx ON friendships (sender_id, status);
CREATE INDEX friendships_receiver_id_status_idx ON friendships (receiver_id, status);
CREATE INDEX friendships_sender_id_receiver_id_idx ON friendships (sender_id, receiver_id);

CREATE TABLE user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_user_id INT NOT NULL,
    blocked_user_id INT NOT NULL,
    created_date TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (blocker_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX user_blocks_blocker_user_id_idx ON user_blocks (blocker_user_id);
CREATE INDEX user_blocks_blocked_user_id_idx ON user_blocks (blocked_user_id);
CREATE INDEX user_blocks_blocker_user_id_blocked_user_id_idx ON user_blocks (blocker_user_id, blocked_user_id);

CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    type SMALLINT NOT NULL DEFAULT 0,
    password VARCHAR,
    members_count INT NOT NULL DEFAULT 1,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (type >= 0 AND type <= 2)
);

CREATE INDEX channels_name_idx ON channels (name);

CREATE TABLE channel_users (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL,
    user_id INT NOT NULL,
    role SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX channel_users_channel_id_idx ON channel_users (channel_id);
CREATE INDEX channel_users_user_id_idx ON channel_users (user_id);
CREATE INDEX channel_users_channel_id_user_id_idx ON channel_users (channel_id, user_id);

CREATE TABLE channel_invitations (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL,
    user_id INT NOT NULL,
    invited_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX channel_invitations_channel_id_idx ON channel_invitations (channel_id);
CREATE INDEX channel_invitations_invited_user_id_idx ON channel_invitations (user_id);
CREATE INDEX channel_invitations_channel_id_invited_user_id_idx ON channel_invitations (channel_id, user_id);
CREATE INDEX channel_invitations_id_invited_user_id ON channel_invitations (id, user_id);

CREATE TABLE channel_bans (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL,
    banned_user_id INT NOT NULL,
    banned_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX channel_bans_channel_id_idx ON channel_bans (channel_id);
CREATE INDEX channel_bans_channel_id_banned_user_id_idx ON channel_bans (channel_id, banned_user_id);

CREATE TABLE channel_mutes (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL,
    muted_user_id INT NOT NULL,
    muted_by_user_id INT NOT NULL,
    muted_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (muted_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (muted_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX channel_mutes_channel_id_idx ON channel_mutes (channel_id);
CREATE INDEX channel_mutes_channel_id_muted_user_id_idx ON channel_mutes (channel_id, muted_user_id);

CREATE TABLE channel_messages (
    id SERIAL PRIMARY KEY,
    type SMALLINT NOT NULL DEFAULT 0,
    channel_id INT NOT NULL,
    user_id INT NOT NULL,
    user_role SMALLINT NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK(user_role >= 0 AND user_role <= 2),
    CHECK(type >= 0 AND type <= 2)
);

CREATE INDEX channel_messages_channel_id_idx ON channel_messages (channel_id);
CREATE INDEX channel_messages_channel_id_created_at_idx ON channel_messages (channel_id, created_at);

CREATE TABLE private_messages (
    id SERIAL PRIMARY KEY,
    type SMALLINT NOT NULL DEFAULT 0,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (type >= 0 AND type <= 1)
);

CREATE INDEX private_messages_sender_id_receiver_id_idx ON private_messages (sender_id, receiver_id);
CREATE INDEX private_messages_id_created_at_idx ON private_messages (id, created_at);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    status SMALLINT NOT NULL DEFAULT 0,
    winner_id INT DEFAULT NULL,
    player_1_user_id INT NOT NULL,
    player_2_user_id INT NOT NULL,
    player_1_score INT NOT NULL DEFAULT 0,
    player_2_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    FOREIGN KEY (player_1_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player_2_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX games_player_1_user_id_idx ON games (player_1_user_id);
CREATE INDEX games_player_2_user_id_idx ON games (player_2_user_id);

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    rank INT NOT NULL DEFAULT 0,
    games_played INT NOT NULL DEFAULT 0,
    games_won INT NOT NULL DEFAULT 0,
    games_lost INT NOT NULL DEFAULT 0,
    win_streak INT NOT NULL DEFAULT 0,
    total_paddle_hits INT NOT NULL DEFAULT 0,
    total_points_scored INT NOT NULL DEFAULT 0,
    total_play_time_seconds INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX user_stats_user_id_idx ON user_stats (user_id);

CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    achievement_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    icon VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX user_achievements_user_id_idx ON user_achievements (user_id);

CREATE TABLE game_stats (
    id SERIAL PRIMARY KEY,
    player_1_user_id INT NOT NULL,
    player_2_user_id INT NOT NULL,
    player_1_score INT NOT NULL DEFAULT 0,
    player_2_score INT NOT NULL DEFAULT 0,
    player_1_paddle_hits INT NOT NULL,
    player_2_paddle_hits INT NOT NULL,
    player_1_wall_hits INT NOT NULL,
    player_2_wall_hits INT NOT NULL,
    player_1_top_paddle_hits INT NOT NULL,
    player_2_top_paddle_hits INT NOT NULL,
    player_1_bottom_paddle_hits INT NOT NULL,
    player_2_bottom_paddle_hits INT NOT NULL,
    player_1_largest_score_streak INT NOT NULL,
    player_2_largest_score_streak INT NOT NULL,
    total_play_time_seconds INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (player_1_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player_2_user_id) REFERENCES users(id) ON DELETE CASCADE
);

