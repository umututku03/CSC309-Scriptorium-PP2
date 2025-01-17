import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

interface Template {
  id: number;
  title: string;
}

interface BlogPost {
  id: number;
  title: string;
  description: string;
  content: string;
  tag: string;
  templates: Template[];
}

const EditBlogPost: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [matchingTemplates, setMatchingTemplates] = useState<Template[]>([]);
  const [showTemplatePopup, setShowTemplatePopup] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Fetch existing blog post data
  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("You need to be logged in to edit posts");
          return;
        }

        const response = await axios.get(`/api/blogposts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const post: BlogPost = response.data.blogPost;
        setTitle(post.title);
        setDescription(post.description);
        setContent(post.content);
        setTag(post.tag);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load blog post");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBlogPost();
  }, [id]);

  const handleTemplateSearch = async (searchText: string) => {
    try {
      const response = await axios.get("/api/codetemplates", {
        params: { title: searchText },
      });
      setMatchingTemplates(response.data.codeTemplates || []);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const currentCursorPosition = e.target.selectionStart;
    setCursorPosition(currentCursorPosition);

    // Check if user has typed `#` followed by text
    const match = newContent.slice(0, currentCursorPosition).match(/#(\w*)$/);
    if (match) {
      const searchText = match[1];
      if (searchText.length > 0) {
        handleTemplateSearch(searchText);
        setShowTemplatePopup(true);
      }
    } else {
      setShowTemplatePopup(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    const beforeCursor = content
      .slice(0, cursorPosition)
      .replace(/#\w*$/, `#${template.id}`);
    const afterCursor = content.slice(cursorPosition);
    setContent(`${beforeCursor}${afterCursor}`);
    setShowTemplatePopup(false);
  };

  const extractTemplateIds = (): number[] => {
    const matches = Array.from(content.matchAll(/#(\d+)/g));
    return matches.map((match: any) => parseInt(match[1]));
  };

  const handleUpdatePost = async () => {
    if (!title || !description || !content || !tag) {
      setError("All fields are required!");
      return;
    }

    const templateIds = extractTemplateIds();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You need to log in to update the blog post.");
        return;
      }

      const response = await axios.put(
        `/api/blogposts/${id}`,
        {
          title,
          description,
          content,
          tag,
          templateIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setSuccess("Blog post updated successfully!");
        setTimeout(() => {
          router.push(`/blogposts/${id}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update blog post.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading post...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-md px-6 py-4 mb-6 border border-border">
          <h1 className="text-2xl font-bold text-card-foreground">Edit Blog Post</h1>
          <p className="text-muted-foreground mt-1">Make changes to your post</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-card rounded-lg shadow-md px-6 py-8 border border-border">
          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-primary/10 border border-primary/20 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-primary">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-colors duration-200"
                placeholder="Enter a descriptive title for your blog post"
              />
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-colors duration-200"
                placeholder="Write a brief description of your post"
                rows={3}
              />
            </div>

            {/* Content Input */}
            <div className="relative">
              <label htmlFor="content" className="block text-sm font-medium text-muted-foreground mb-1">
                Content
              </label>
              <div className="mt-1 mb-2">
                <span className="text-sm text-muted-foreground">
                  Use <code className="px-1 py-0.5 bg-muted rounded text-sm">
                    #title
                  </code> to reference templates
                </span>
              </div>
              <textarea
                id="content"
                value={content}
                onChange={handleContentChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-colors duration-200"
                placeholder="Write your blog post content here..."
                rows={12}
              />

              {/* Template Popup */}
              {showTemplatePopup && matchingTemplates.length > 0 && (
                <div className="absolute left-0 right-0 bg-card border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                  {matchingTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="px-4 py-2 hover:bg-muted cursor-pointer transition-colors duration-200 border-b border-border last:border-b-0"
                    >
                      <span className="text-primary">#{template.id}</span>
                      <span className="mx-2 text-muted-foreground">-</span>
                      <span className="text-card-foreground">{template.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Input */}
            <div>
              <label htmlFor="tag" className="block text-sm font-medium text-muted-foreground mb-1">
                Tags
              </label>
              <input
                type="text"
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-colors duration-200"
                placeholder="Enter tags (comma-separated)"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => router.push(`/blogposts/${id}`)}
                className="px-6 py-2 border border-border text-muted-foreground rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePost}
                disabled={loading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBlogPost;