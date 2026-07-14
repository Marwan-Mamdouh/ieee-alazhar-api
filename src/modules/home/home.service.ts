import { sanityClient } from "../../config/sanity.js";
import type { HomePageData } from "./home.types.js";

const homeService = {
  getHomeData: async (): Promise<HomePageData> => {
    return sanityClient.fetch(`*[_type == "homePage"][0] {
      home_images[] {
        image { asset -> { url } }
      }
    }`);
  },
};

export default homeService;
