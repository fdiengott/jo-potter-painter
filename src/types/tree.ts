export type Tree = {
    path: string
    mode: string
    type: string
    sha: string
}

export interface EnrichedTree extends Tree {
    alt: string
}
