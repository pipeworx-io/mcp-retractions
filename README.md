# mcp-retractions

Retractions / research-integrity MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1175+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
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

Or connect to the full Pipeworx gateway for access to all 1175+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
