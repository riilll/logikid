create table users (
    id uuid primary key default gen_random_uuid(),
    nama varchar(100) not null,
    email varchar(255) unique not null,
    created_at timestamptz default now()
);

create table child_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    nama_anak varchar(100) not null,
    umur integer,
    kelas varchar(20),
    created_at timestamptz default now()
);

create table quizzes (
    id uuid primary key default gen_random_uuid(),
    pertanyaan text not null,
    jawaban varchar(20) not null,
    kategori varchar(50),
    level varchar(20),
    created_at timestamptz default now()
);

create table quiz_attempts (
    id uuid primary key default gen_random_uuid(),
    child_id uuid not null references child_profiles(id) on delete cascade,
    soal text not null,
    jawaban_anak varchar(20),
    jawaban_benar varchar(20),
    is_correct boolean not null,
    created_at timestamptz default now()
);

create table rewards (
    id uuid primary key default gen_random_uuid(),
    child_id uuid not null unique references child_profiles(id) on delete cascade,
    total_poin integer default 0,
    level integer default 1,
    streak integer default 0,
    updated_at timestamptz default now()
);