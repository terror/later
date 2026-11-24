/* tslint:disable */
/* eslint-disable */
export interface Article {
    article_id: string;
    url: string;
    title: string | null;
    author: string | null;
    excerpt: string | null;
    site_name: string | null;
    lang: string | null;
    dir: string | null;
    publication_date: string | null;
    word_count: number | null;
    reading_time_minutes: number | null;
    is_archived: boolean;
    is_favorited: boolean;
    date_saved: string;
    date_read: string | null;
    progress: ReadingProgress;
}

export interface ArticleWithContent extends Article {
    content: string | null;
}

export interface CreateHighlight {
    end_offset: number;
    selected_text: string;
    start_offset: number;
}

export interface CreatedToken {
    token: string;
}

export interface Highlight {
    highlight_id: string;
    article_id: string;
    selected_text: string;
    context_before: string | null;
    context_after: string | null;
    start_offset: number;
    end_offset: number;
    color: string;
    note: string | null;
    created_at: string;
    updated_at: string;
}

export interface ReadingProgress {
    scroll_position: number;
    time_spent_seconds: number;
}

export interface SaveArticle {
    html?: string;
    url: string;
}

export interface UpdateArticle {
    is_archived?: boolean;
    is_favorited?: boolean;
    is_read?: boolean;
}

export interface UpdateHighlight {
    color?: string;
    note?: string;
}

export interface User {
    /**
     * Unique identifier for the user.
     */
    user_id: string;
    /**
     * Primary user email used for authentication.
     */
    email: string;
    /**
     * Display name supplied by the user, if available.
     */
    name: string | null;
    /**
     * Timestamp for when the user record was created.
     */
    created_at: string;
    /**
     * Timestamp for when the user record was most recently updated.
     */
    updated_at: string;
}
