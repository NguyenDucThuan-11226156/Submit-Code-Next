import { MeiliSearch } from "meilisearch";

const meiliSearchClient = new MeiliSearch({
  host: "https://fit.neu.edu.vn/search_api",
  apiKey: "khongdoanduocdau123",
});

export const searchClient = (categorySlug) => ({
  async search(requests) {
    const { indexName, params } = requests[0];
    const page = params.page || 0;
    const hitsPerPage = params.hitsPerPage || 12;

    const filters = categorySlug
      ? `blog_category.slug = "${categorySlug}"`
      : "";

    return meiliSearchClient
      .index(indexName)
      .search(params.query, {
        limit: hitsPerPage,
        offset: page * hitsPerPage,
        filter: filters,
      })
      .then((res) => ({
        results: [
          {
            ...res,
            page: page,
            nbPages: Math.ceil(res.estimatedTotalHits / hitsPerPage),
            hitsPerPage: hitsPerPage,
          },
        ],
      }));
  },
});
