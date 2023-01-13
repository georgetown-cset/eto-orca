module.exports = {
  siteMetadata: {
    title: `github-metrics`,
    siteUrl: `https://www.yourdomain.tld`
  },
  plugins: ["gatsby-plugin-mdx", {
    resolve: 'gatsby-source-filesystem',
    options: {
      "name": "pages",
      "path": "./src/pages/"
    },
    __key: "pages"
  }, `gatsby-plugin-emotion`,
  {
    resolve: "gatsby-plugin-manifest",
    options: {
      icon: "src/images/favicon.svg"
    },
  },]
};
