# Scene-Based Movie Search Pipeline Architecture

## High-Level Pipeline Diagram

```
User Query (Natural Language)
    ↓
[STEP 1] Scene Understanding (LLM)
    → Extract: entities, events, environment, themes
    → Output: Structured SceneDescription JSON
    ↓
[STEP 2] Query Canonicalization
    → Combine all terms into single search string
    → Output: "ship iceberg collision sinking ocean disaster"
    ↓
[STEP 3] Candidate Retrieval (TMDB)
    → Search by entities/events
    → Filter: vote_count > 300, keyword intersection
    → Max 30 candidates
    ↓
[STEP 4] Embedding-Based Retrieval
    → Embed: query, overviews, keywords (individual)
    → Score: max(keyword_sim) * 0.6 + overview_sim * 0.4
    → Top 5 candidates
    ↓
[STEP 5] LLM Re-ranking (Top 5 Only)
    → LLM analyzes scene vs candidates
    → Returns: best match index + confidence + explanation
    ↓
[STEP 6] Final Response
    → Format results with metadata
    → Return: movie details + confidence score
```

## Why This Works

1. **LLM Scene Understanding**: Transforms vague descriptions into structured data, enabling precise matching
2. **Canonical Query**: Normalizes language variations into consistent search terms
3. **Aggressive Filtering**: vote_count > 300 ensures quality; keyword intersection reduces noise
4. **Retrieval-Optimized Embeddings**: e5-base-v2 is better for retrieval than general-purpose models
5. **Individual Keyword Embeddings**: Captures fine-grained semantic matches (e.g., "iceberg" matches "Titanic")
6. **LLM Re-ranking**: Final reasoning step ensures correct match even if embedding scores are close

## Key Design Decisions

- **No database**: All data fetched on-demand from TMDB
- **Serverless-friendly**: Stateless functions, minimal dependencies
- **Deterministic**: Same query → same results (except LLM randomness, minimized with low temperature)
- **Debuggable**: Each step logs clearly, errors are caught and logged
- **Cost-effective**: LLM used only twice (scene analysis + re-ranking), not for every candidate

## Example Flow

**Input:**
```
"bir gemi buzula çarpıp batıyordu"
```

**STEP 1 Output:**
```json
{
  "entities": ["ship", "iceberg"],
  "events": ["collision", "sinking"],
  "environment": ["ocean", "cold"],
  "themes": ["disaster", "survival"],
  "time_hint": "historical"
}
```

**STEP 2 Output:**
```
"ship iceberg collision sinking ocean disaster survival historical"
```

**STEP 3 Output:**
- 30 candidates from TMDB (Titanic, Poseidon, etc.)

**STEP 4 Output:**
- Top 5: Titanic (0.85), Poseidon (0.72), ...

**STEP 5 Output:**
- Titanic selected with 95% confidence
- Explanation: "Ship hits iceberg and sinks - matches Titanic perfectly"

**STEP 6 Output:**
- Final result with poster, description, confidence score

## Implementation Files

- `src/services/sceneSearchPipeline.ts` - Main pipeline
- `src/pages/SearchResultsPage.tsx` - Frontend integration
- `netlify/functions/embedding.js` - Embedding API (supports model parameter)
- `api/embedding.ts` - Vercel embedding API

## Environment Variables Required

- `VITE_OPENAI_API_KEY` - For LLM calls
- `VITE_HUGGING_FACE_API_KEY` - For embeddings
- `VITE_TMDB_API_KEY` - For movie data

## Performance Characteristics

- **Latency**: ~5-10 seconds (LLM calls are the bottleneck)
- **Cost**: ~$0.01-0.02 per search (2 LLM calls + embeddings)
- **Accuracy**: High (LLM reasoning ensures correct matches)
