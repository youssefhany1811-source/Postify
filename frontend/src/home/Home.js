import { useEffect, useRef, useState } from "react";
import DisplayHomePosts from "../components/displayPosts/DisplayHomePosts";
import { CiSearch } from "react-icons/ci";
import { usePosts } from "../context/PostsContext";
import { useInView } from "motion/react";
import { Link } from "react-router-dom";
import api from "../api/axios";
function Home() {
  const [searchPosts, setSearchPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref);
  const [isVisible, setIsVisible] = useState(false);
  const searchRef = useRef(null);

  // Show element when specific logic is met
  const handleShow = () => {
    setIsVisible(true);
  };

  // Hide element when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setIsVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const {
    addPostsToSection,
    setLoadHomePosts,
    homeCurrentPage,
    setHomeCurrentPage,
    homeLastPage,
    hasFetchedHomePosts,
    setHasFetchedHomePosts,
    setHomeLastPage,
  } = usePosts();

  async function handleSearch(e) {
    handleShow();
    let value = e.target.value;
    let res = await api.get(`reports/search?query=${value}`);
    if (!res.error) {
      const posts = res.data.data;
      setSearchPosts(posts);
    }
  }

  function renderSearchInput() {
    return (
      <div className='relative w-full max-w-2xl mb-[40px]'>
        <div
          className='flex items-center bg-slate-900/70 border border-cyan-200/20 rounded-2xl px-4 py-2
                      hover:border-cyan-300/40 focus-within:border-cyan-400 transition-all duration-200 shadow-lg backdrop-blur-sm'
        >
          <CiSearch className='text-cyan-200 size-5 mr-2' />
          <input
            onChange={handleSearch}
            placeholder='Search reports'
            className='bg-transparent border-none w-full outline-none text-slate-100 placeholder-slate-400 !mb-0'
            autoComplete='off'
          />
        </div>

        {isVisible && (
          <div
            ref={searchRef}
            className='absolute top-full mt-2 left-0 right-0 custom-scroll-bar scrollbar-hidden
                     overflow-auto p-3 opacity-[97%] max-h-[310px] rounded-2xl z-20
                     bg-slate-900/95 border border-cyan-200/20 shadow-xl backdrop-blur-md'
          >
            {searchPosts.length > 0 ? (
              searchPosts.map((post, index) => (
                <Link
                  to={`/reports/${post.id}`}
                  key={index}
                  className='flex gap-3 items-center mb-2 hover:bg-cyan-500/20 p-2 rounded-lg transition'
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className='rounded min-8 w-8 h-8 object-cover'
                    />
                  ) : (
                    <div className='rounded bg-cyan-800/40 min-8 w-8 h-8' />
                  )}
                  <div className='text-slate-100'>{post.title}</div>
                </Link>
              ))
            ) : (
              <div className='text-slate-400 text-center py-10'>
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    if (isInView && !loading && homeCurrentPage < homeLastPage) {
      setHomeCurrentPage((prev) => prev + 1);
      setHasFetchedHomePosts(false);
    }
  }, [
    hasFetchedHomePosts,
    homeCurrentPage,
    homeLastPage,
    loading,
    setHasFetchedHomePosts,
    setHomeCurrentPage,
    isInView,
  ]);

  useEffect(() => {
    async function getPosts() {
      setLoading(true);
      let res = await api.get(`reports/home?page=${homeCurrentPage}`);
      if (!res.error) {
        let posts = res.data.posts.data;
        posts.forEach((post) => {
          post.section = "home";
        });
        const lastPage = res.data.posts.last_page;

        addPostsToSection(posts, "home");
        setHomeLastPage(lastPage);
      }
      setLoadHomePosts(false);
      setLoading(false);
      setHasFetchedHomePosts(true);
    }
    if (!hasFetchedHomePosts) {
      getPosts();
    }
  }, [homeCurrentPage]);

  return (
    <div className='container-c'>
      {renderSearchInput()}
      <div className='w-[100%]'>
        <DisplayHomePosts />
      </div>
      <div ref={ref} style={{ height: 20, background: "transparent" }}></div>
    </div>
  );
}

export default Home;
