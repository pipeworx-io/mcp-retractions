# mcp-retractions

Retractions / research-integrity MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `check_retraction` | Check whether a paper (by DOI) has been retracted, according to Crossref/Retraction Watch (keyless). Returns retracted:true/false with the evidence (title marker + retraction-notice link). NOTE: 'not retracted' means no retraction is on record — coverage depends on the publisher, so it is not definitive proof the paper is clean. |
| `search_retractions` | Search the retracted literature (Crossref update-type:retraction, ~73k works) by keyword, optionally filtered by subject and publication year range. Returns retracted works with DOI, title, journal and date. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "retractions": {
      "url": "https://gateway.pipeworx.io/retractions/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Retractions data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
