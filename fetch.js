const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3000;

app.use(express.json());

// Middleware for error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Middleware to fetch blog data from the third-party API
app.use('/api/blog-stats', async (req, res, next) => {
  try {
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });
    
    req.blogData = response.data.blogs;
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware for data analysis
app.use('/api/blog-stats', (req, res, next) => {
  const {blogData}  = req;
  
  

  if (blogData.length==0) {
    return res.status(500).json({ error: 'Internal server error. No data is received' });
  }


  const totalBlogs = blogData.length;
  console.log(totalBlogs);
  const longestTitleBlog = _.maxBy(blogData, 'title.length');
  const blogsWithPrivacyKeyword = blogData.filter(blog => blog.title.toLowerCase().includes('privacy'));
  const uniqueBlogTitles = _.uniqBy(blogData, 'title');

  req.blogStats = {
    totalBlogs,
    longestTitle: longestTitleBlog.title,
    blogsWithPrivacy: blogsWithPrivacyKeyword.length,
    uniqueBlogTitles: uniqueBlogTitles.map(blog => blog.title),
  };

  next();
});

app.use('/api/blog-search', async (req, res, next) => {
    try {
      const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
        headers: {
          'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
        },
      });
      
      req.blogData = response.data.blogs;
      next();
    } catch (error) {
      next(error);
    }
  });

// Middleware for blog search
app.get('/api/blog-search', (req, res, next) => {
  const { query } = req.query;
  const { blogData } = req;
  console.log(blogData);

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "query" is required.' });
  }

  if (blogData.length==0) {
    return res.status(500).json({ error: 'Internal server error. No data is received' });
  }
  
  const searchResults = blogData.filter(blog => blog.title.toLowerCase().includes(query.toLowerCase()));

  res.json({ results: searchResults });
});

// Middleware for responding with statistics
app.get('/api/blog-stats', (req, res) => {
  const { blogStats } = req;
  res.json(blogStats);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
