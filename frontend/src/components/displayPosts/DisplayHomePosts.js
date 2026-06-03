import { Link, useLocation } from "react-router-dom";
import { displayDate } from "../../utility/functions";
import { BsBookmarkCheckFill, BsBookmark } from "react-icons/bs";
import api from "../../api/axios";
import HomeSkeleton from "../skeletons/HomeSkeleton";
import { usePosts } from "../../context/PostsContext";

function DisplayHomePosts({ pageTitle = "Latest Reports" }) {
  const location = useLocation();
  const { allPosts, loadHomePosts, toggleSavedPostState } = usePosts();

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

  function DisplayUser({ user }) {
    const avatar = user.avatar;
    const username = user.username;
    return (
      <Link
        to={`/user/${user.id}`}
        className='text-slate-200 flex mb-3 items-center gap-x-[8px] z-20'
      >
        {avatar && (
          <img
            className='w-[34px] rounded-full h-[34px] object-cover ring-2 ring-white/20'
            src={avatar}
            alt={username || "user avatar"}
          />
        )}
        {username && username}
      </Link>
    );
  }

  return (
    <>
      <h1 className='page-title'>{pageTitle}</h1>
      {!loadHomePosts ? (
        <>
          {allPosts.home.allIds.length !== 0 ? (
            allPosts.home.allIds
              .map((id) => {
                const post = allPosts.byId[id];
                if (!post) return null;

                const user = post.user;
                const title = post.title || "";
                const created_at = post.created_at;
                const image = post.image_url;
                const is_saved = post.is_saved || false;
                const section = post.section;
                const canUpdate = post.canUpdate || false;
                const category = post.category;
                const status = post.status;
                const locationLabel = post.location;

                return (
                  <Link
                    state={{ from: location.pathname }}
                    to={canUpdate ? `/reports/${id}/edit` : `/reports/${id}`}
                    className='mb-4 block'
                    key={id}
                  >
                    <div className='post-card flex gap-x-[14px] max-w-[700px] justify-between break-all'>
                      <div className='w-[100%] flex flex-col justify-center gap-y-[12px]'>
                        <div>
                          {user && <DisplayUser user={user} />}
                          <h1 className='text-xl font-bold text-white'>{title}</h1>
                          <div className='mt-2 flex flex-wrap gap-2 text-xs text-slate-200'>
                            {category && (
                              <span className='report-meta-chip bg-cyan-800/60'>
                                {category.replaceAll("_", " ")}
                              </span>
                            )}
                            {status && (
                              <span className='report-meta-chip bg-emerald-800/60'>
                                {status.replaceAll("_", " ")}
                              </span>
                            )}
                            {locationLabel && (
                              <span className='report-meta-chip bg-slate-700/80'>
                                {locationLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className='text-slate-300 text-sm flex gap-x-[20px] items-center'>
                          {created_at && displayDate(created_at)}
                          <div className='flex items-center gap-2 z-10'>
                            <SaveIcon
                              onClick={(e) =>
                                handleSavePost(e, { id, is_saved, section })
                              }
                              isSaved={is_saved}
                            />
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
              .filter(Boolean)
          ) : (
            <div className='text-slate-300'>No reports found yet.</div>
          )}
        </>
      ) : (
        <div className='container-c'>
          <HomeSkeleton />
        </div>
      )}
    </>
  );
}

export default DisplayHomePosts;
