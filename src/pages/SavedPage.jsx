import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import ThreadCard from "../components/ThreadCard";
import { getSavedItems } from "../services/api";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SavedPage = () => {
  const [savedItems, setSavedItems] = useState({
    posts: [],
    replies: [],
    trendingTopics: [],
    trendingReplies: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        const response = await getSavedItems();
        if (response.data) {
          setSavedItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching saved items:', error);
        toast({
          title: "Error",
          description: "Failed to load saved items",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchSavedItems();
    }
  }, [currentUser]);

  return (
    <MainLayout>
      <div className="saved-page">
        <h1 className="text-2xl font-bold mb-6">Saved Items</h1>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">
              Posts ({savedItems.posts.length})
            </TabsTrigger>
            <TabsTrigger value="replies">
              Post Replies ({savedItems.replies.length})
            </TabsTrigger>
            <TabsTrigger value="trending">
              Trending Topics ({savedItems.trendingTopics.length})
            </TabsTrigger>
            <TabsTrigger value="trendingReplies">
              Trending Replies ({savedItems.trendingReplies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {isLoading ? (
              <div className="text-center">Loading saved posts...</div>
            ) : savedItems.posts.length > 0 ? (
              savedItems.posts.map(post => (
                <ThreadCard key={post._id} thread={post} />
              ))
            ) : (
              <div className="text-center text-gray-500">No saved posts yet</div>
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-6">
            {isLoading ? (
              <div className="text-center">Loading saved replies...</div>
            ) : savedItems.replies.length > 0 ? (
              savedItems.replies.map(reply => (
                <div key={reply._id} className="saved-reply-card">
                  <ThreadCard thread={reply.post} highlightedReplyId={reply._id} />
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">No saved replies yet</div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            {isLoading ? (
              <div className="text-center">Loading saved trending topics...</div>
            ) : savedItems.trendingTopics.length > 0 ? (
              savedItems.trendingTopics.map(topic => (
                <ThreadCard key={topic._id} thread={topic} isTrendingTopic={true} />
              ))
            ) : (
              <div className="text-center text-gray-500">No saved trending topics yet</div>
            )}
          </TabsContent>

          <TabsContent value="trendingReplies" className="mt-6">
            {isLoading ? (
              <div className="text-center">Loading saved trending replies...</div>
            ) : savedItems.trendingReplies.length > 0 ? (
              savedItems.trendingReplies.map(reply => (
                <div key={reply._id} className="saved-reply-card">
                  <ThreadCard 
                    thread={reply.topic} 
                    highlightedReplyId={reply._id}
                    isTrendingTopic={true}
                  />
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">No saved trending replies yet</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SavedPage; 