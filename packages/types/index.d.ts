/* tslint:disable */
/* eslint-disable */
export interface Article {
    articleId: string;
    url: string;
    status: ArticleStatus;
    title: string | null;
    author: string | null;
    excerpt: string | null;
    siteName: string | null;
    lang: string | null;
    dir: string | null;
    publicationDate: string | null;
    wordCount: number | null;
    readingTimeMinutes: number | null;
    isArchived: boolean;
    isFavorited: boolean;
    dateSaved: string;
    dateRead: string | null;
    progress: ReadingProgress;
}

export interface ArticlePage {
    articles: Article[];
    nextCursor: string | null;
}

export interface ArticleWithContent extends Article {
    content: string | null;
}

export interface CreateHighlight {
    endOffset: number;
    selectedText: string;
    startOffset: number;
}

export interface CreatedToken {
    token: string;
}

export interface Highlight {
    highlightId: string;
    articleId: string;
    selectedText: string;
    contextBefore: string | null;
    contextAfter: string | null;
    startOffset: number;
    endOffset: number;
    color: string;
    note: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ListArticles {
    cursor?: string;
    limit?: number;
}

export interface ReadingProgress {
    scrollPosition: number;
    timeSpentSeconds: number;
}

export interface SaveArticle {
    html?: string;
    url: string;
}

export interface UpdateArticle {
    isArchived?: boolean;
    isFavorited?: boolean;
    isRead?: boolean;
}

export interface UpdateHighlight {
    color?: string;
    note?: string;
}

export interface User {
    /**
     * Unique identifier for the user.
     */
    userId: string;
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
    createdAt: string;
    /**
     * Timestamp for when the user record was most recently updated.
     */
    updatedAt: string;
}

export type ArticleStatus = "pending" | "extracted" | "failed";
