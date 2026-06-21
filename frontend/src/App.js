import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignIn from "./auth/signIn/SignIn";
import SignUp from "./auth/signUp/SignUp";
import Home from "./home/Home";
import Navbar from "./components/Navbar";
import Protected from "./components/Protected";
import GoogleCallback from "./auth/GoogleCallback";
import VisitedUser from "./user/VisitedUser";
import { Suspense, lazy, useEffect } from "react";

// Lazy-loaded components
const History = lazy(() => import("./myPosts/history/History"));
const Saved = lazy(() => import("./myPosts/saved/Saved"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PostEdit = lazy(() => import("./post/PostEdit"));
const PostView = lazy(() => import("./post/PostView"));
const UserProfile = lazy(() => import("./user/UserProfile"));
const PostCreate = lazy(() => import("./post/PostCreate"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const GizaEntityDashboard = lazy(() => import("./pages/GizaEntityDashboard"));

function App() {
  useEffect(() => {
    const initialSpinner = document.querySelector("#preload-spinner-container");
    if (initialSpinner) initialSpinner.style.display = "none";
  }, []);

  function SuspenseLoading() {
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      ></div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<SuspenseLoading />}>
        <Routes>
          <Route path='/auth/google' element={<GoogleCallback />} />
          <Route element={<Protected />}>
            <Route element={<Navbar />}>
              <Route path='/admin/dashboard' element={<AdminDashboard />} />
              <Route path='/entity/giza' element={<GizaEntityDashboard />} />
              <Route path='/user/:visitedUserId' element={<VisitedUser />} />
              <Route path='/' element={<Home />} />
              <Route path='/reports/new' element={<PostCreate />} />
              <Route path='/reports/:id' element={<PostView />} />
              <Route path='/reports/:id/edit' element={<PostEdit />} />
              <Route path='/reports/history' element={<History />} />
              <Route path='/reports/saved' element={<Saved />} />
              <Route path='/view/:id' element={<PostView />} />
              <Route path='/notifications' element={<Notifications />} />
              <Route path='/profile' element={<UserProfile />} />
              <Route path='/write' element={<PostCreate />} />
              <Route path='/edit/:id' element={<PostEdit />} />
              <Route path='/posts'>
                <Route path='history' element={<History />} />
                <Route path='saved' element={<Saved />} />
              </Route>
            </Route>
          </Route>
          <Route path='/signin' element={<SignIn />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
export default App;
