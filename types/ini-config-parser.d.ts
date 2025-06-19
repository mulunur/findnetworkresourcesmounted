declare module 'ini-config-parser' {
    function parse(content: string): Record<string, any>;
    export interface ParserOptions {
        ignoreMissingAssign?: boolean;
        merge?: boolean;
        inherit?: boolean;
        dotKey?: boolean;
        nativeType?: boolean;
        mstring?: boolean;
        assign?: string[];
    }
    export = parse;
  }