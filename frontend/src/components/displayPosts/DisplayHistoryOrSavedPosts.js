import { Link, useLocation } from "react-router-dom";
import { displayDate } from "../../utility/functions";
import { BsBookmarkCheckFill } from "react-icons/bs";
import { BsBookmark } from "react-icons/bs";
import api from "../../api/axios";
import HistorySkeleton from "../skeletons/HistorySkeleton";
import SavedSkeleton from "../skeletons/SavedSkeleton";
import { usePosts } from "../../context/PostsContext";

function DisplayHistoryOrSavedPosts({ loading, pageTitle, type }) {
  const sectionKey = type === "edit" ? "history" : "saved";
  const location = useLocation();
  const { allPosts, toggleSavedPostState } = usePosts();

  async function handleSavePost(e, post) {
    e.preventDefault();
    e.stopPropagation();
    const postId = post.id;

    toggleSavedPostState(postId);

    try {
      await api.post(`reports/${postId}/save`);
    } catch (error) {
      console.log(error);
    }
  }

  function SaveIcon({ isSaved, onClick }) {
    const Icon = isSaved ? BsBookmarkCheckFill : BsBookmark;
    return (
      <Icon
        onClick={onClick}
        className='cursor-pointer z-20'
        style={{ fontSize: "20px" }}
      />
    );
  }

  function DisplayUser({ post }) {
    const user = post?.user;
    if (!user) return null;

    return (
      <Link
        to={`/user/${user.id}`}
        className='flex mb-3 items-center gap-x-[6px] z-20'
      >
        {user.avatar && (
          <img
            className='w-[34px] rounded-full h-[34px] object-cover'
            src={user.avatar}
            alt=''
          />
        )}
        {user.username && user.username}
      </Link>
    );
  }

  return (
    <>
      {!loading ? (
        <>
          <h1 className='page-title'>{pageTitle}</h1>
          {allPosts[sectionKey].allIds.length !== 0 ? (
            allPosts[sectionKey].allIds
              .map((id) => {
                const post = allPosts.byId[id];

                // Safety check - skip if post doesn't exist
                if (!post) return null;

                const title = post.title || "";
                const created_at = post.created_at;
                const image = post.image_url;
                const is_saved = post.is_saved || false;
                const section = post.section;
                const is_hero = post.is_hero || false;
                const categoryValue = post.category;
                const statusValue = post.status;
                const locationValue = post.location;

                return (
                  <Link
                    state={{ from: location.pathname }}
                    to={type === "edit" ? `/reports/${id}/edit` : `/reports/${id}`}
                    className='mb-4 block'
                    key={id}
                  >
                    <div className='post-card flex gap-x-[14px] max-w-[700px] justify-between break-all'>
                      <div className='w-[100%] flex flex-col justify-center gap-y-[12px]'>
                        <div>
                          {pageTitle !== "History" && (
                            <DisplayUser post={post} />
                          )}

                          <h1 className='text-xl font-bold text-white'>{title}</h1>
                          <div className='mt-2 flex flex-wrap gap-2 text-xs text-slate-200'>
                            {categoryValue && (
                              <span className='report-meta-chip bg-cyan-800/60'>
                                {categoryValue.replaceAll("_", " ")}
                              </span>
                            )}
                            {statusValue && (
                              <span className='report-meta-chip bg-emerald-800/60'>
                                {statusValue.replaceAll("_", " ")}
                              </span>
                            )}
                            {locationValue && (
                              <span className='report-meta-chip bg-slate-700/80'>
                                {locationValue}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className='text-slate-300 text-sm flex gap-x-[20px] items-center'>
                          {created_at && displayDate(created_at)}
                          <div className='flex items-center gap-2 z-10'>
                            {pageTitle !== "Saved" && (
                              <SaveIcon
                                isSaved={is_saved}
                                onClick={(e) =>
                                  handleSavePost(e, {
                                    id,
                                    is_saved,
                                    section,
                                    is_hero,
                                  })
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      {image && (
                        <img
                          src={image}
                          alt={title}
                          className='w-[160px] min-w-[160px] h-[120px] rounded-xl object-cover shadow-md'
                        />
                      )}
                    </div>
                  </Link>
                );
              })
              .filter(Boolean) // Remove null entries
          ) : (
            <h1>No Reports Found</h1>
          )}
        </>
      ) : (
        <div className='container-c'>
          {pageTitle === "History" ? <HistorySkeleton /> : <SavedSkeleton />}
        </div>
      )}
    </>
  );
}

export default DisplayHistoryOrSavedPosts;
