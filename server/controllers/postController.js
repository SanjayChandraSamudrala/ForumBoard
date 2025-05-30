const Post = require('../models/Post');
const User = require('../models/User');

// Get all posts with optional filtering
exports.getPosts = async (req, res) => {
  try {
    const { 
      category,
      sort = 'latest',
      page = 1,
      limit = 10,
      status = 'active'
    } = req.query;

    const query = { status };
    if (category) query.category = category;

    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'mostLiked':
        sortOption = { 'likes.length': -1 };
        break;
      case 'mostReplies':
        sortOption = { 'replies.length': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await Post.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name image')
      .populate('replies.author', 'name image');

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single post by ID
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name image')
      .populate('replies.author', 'name image')
      .populate('likes', 'name image')
      .populate('dislikes', 'name image');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    const post = new Post({
      title,
      content,
      category,
      author: req.user._id
    });

    await post.save();

    // Add the post reference to the user's threads array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { threads: post._id } },
      { new: true }
    );

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name image');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    post.title = title;
    post.content = content;
    post.category = category;

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name image')
      .populate('replies.author', 'name image');

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await post.remove();
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a reply to a post
exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Create the reply with proper number initialization
    const newReply = {
      content,
      author: req.user._id,
      likes: 0,
      dislikes: 0,
      userLiked: false,
      userDisliked: false,
      createdAt: new Date()
    };

    post.replies.push(newReply);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name image')
      .populate('replies.author', 'name image');

    res.json(updatedPost);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: error.message });
  }
};

// Like or unlike a post
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Initialize if not exists
    if (!post.likes) post.likes = { count: 0, users: [] };
    if (!post.dislikes) post.dislikes = { count: 0, users: [] };

    const hasLiked = post.likes.users.includes(userId);
    const hasDisliked = post.dislikes.users.includes(userId);

    // Toggle like
    if (hasLiked) {
      // Remove like
      post.likes.users = post.likes.users.filter(id => !id.equals(userId));
      post.likes.count = Math.max(0, post.likes.count - 1);
    } else {
      // Add like
      post.likes.users.push(userId);
      post.likes.count += 1;

      // Remove dislike if exists
      if (hasDisliked) {
        post.dislikes.users = post.dislikes.users.filter(id => !id.equals(userId));
        post.dislikes.count = Math.max(0, post.dislikes.count - 1);
      }
    }

    await post.save();

    res.json({
      likes: post.likes.count,
      dislikes: post.dislikes.count,
      userLiked: post.likes.users.includes(userId),
      userDisliked: post.dislikes.users.includes(userId)
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dislike or un-dislike a post
exports.toggleDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Initialize if not exists
    if (!post.likes) post.likes = { count: 0, users: [] };
    if (!post.dislikes) post.dislikes = { count: 0, users: [] };

    const hasLiked = post.likes.users.includes(userId);
    const hasDisliked = post.dislikes.users.includes(userId);

    // Toggle dislike
    if (hasDisliked) {
      // Remove dislike
      post.dislikes.users = post.dislikes.users.filter(id => !id.equals(userId));
      post.dislikes.count = Math.max(0, post.dislikes.count - 1);
    } else {
      // Add dislike
      post.dislikes.users.push(userId);
      post.dislikes.count += 1;

      // Remove like if exists
      if (hasLiked) {
        post.likes.users = post.likes.users.filter(id => !id.equals(userId));
        post.likes.count = Math.max(0, post.likes.count - 1);
      }
    }

    await post.save();

    res.json({
      likes: post.likes.count,
      dislikes: post.dislikes.count,
      userLiked: post.likes.users.includes(userId),
      userDisliked: post.dislikes.users.includes(userId)
    });
  } catch (error) {
    console.error('Error toggling dislike:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle like on a reply
exports.toggleReplyLike = async (req, res) => {
  try {
    const { postId, replyId } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reply = post.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    // Initialize likes/dislikes if they don't exist
    if (!reply.likes) {
      reply.likes = { count: 0, users: [] };
    }
    if (!reply.dislikes) {
      reply.dislikes = { count: 0, users: [] };
    }

    const hasLiked = reply.likes.users.includes(userId);
    const hasDisliked = reply.dislikes.users.includes(userId);

    // Toggle like
    if (hasLiked) {
      // Remove like
      reply.likes.users = reply.likes.users.filter(id => !id.equals(userId));
      reply.likes.count = Math.max(0, reply.likes.count - 1);
    } else {
      // Add like
      reply.likes.users.push(userId);
      reply.likes.count += 1;

      // Remove dislike if exists
      if (hasDisliked) {
        reply.dislikes.users = reply.dislikes.users.filter(id => !id.equals(userId));
        reply.dislikes.count = Math.max(0, reply.dislikes.count - 1);
      }
    }

    await post.save();

    res.json({
      likes: reply.likes.count,
      dislikes: reply.dislikes.count,
      userLiked: reply.likes.users.includes(userId),
      userDisliked: reply.dislikes.users.includes(userId)
    });
  } catch (error) {
    console.error('Error toggling reply like:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle dislike on a reply
exports.toggleReplyDislike = async (req, res) => {
  try {
    const { postId, replyId } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reply = post.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    // Initialize likes/dislikes if they don't exist
    if (!reply.likes) {
      reply.likes = { count: 0, users: [] };
    }
    if (!reply.dislikes) {
      reply.dislikes = { count: 0, users: [] };
    }

    const hasLiked = reply.likes.users.includes(userId);
    const hasDisliked = reply.dislikes.users.includes(userId);

    // Toggle dislike
    if (hasDisliked) {
      // Remove dislike
      reply.dislikes.users = reply.dislikes.users.filter(id => !id.equals(userId));
      reply.dislikes.count = Math.max(0, reply.dislikes.count - 1);
    } else {
      // Add dislike
      reply.dislikes.users.push(userId);
      reply.dislikes.count += 1;

      // Remove like if exists
      if (hasLiked) {
        reply.likes.users = reply.likes.users.filter(id => !id.equals(userId));
        reply.likes.count = Math.max(0, reply.likes.count - 1);
      }
    }

    await post.save();

    res.json({
      likes: reply.likes.count,
      dislikes: reply.dislikes.count,
      userLiked: reply.likes.users.includes(userId),
      userDisliked: reply.dislikes.users.includes(userId)
    });
  } catch (error) {
    console.error('Error toggling reply dislike:', error);
    res.status(500).json({ error: error.message });
  }
}; 