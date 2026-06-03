import React, { useState } from "react";
import logo from "../images/leaf.png";

import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Outlet, useLocation } from "react-router";
import { Link, NavLink } from "react-router-dom";
import { getUserInfo } from "../api/authService";
import { useNotifications } from "../context/NotificationsContext";
const { Disclosure, DisclosureButton, DisclosurePanel } = await import(
  "@headlessui/react"
);
const { Menu, MenuButton, MenuItem, MenuItems } = await import(
  "@headlessui/react"
);

const navigation = [
  { name: "Home", href: "/" },
  { name: "Report Issue", href: "/reports/new" },
];

const navMobile = [
  { name: "Home", href: "/" },
  { name: "Report Issue", href: "/reports/new" },
  { name: "My Reports", href: "/reports/history" },
  { name: "Saved Reports", href: "/reports/saved" },
];
const userNavigation = [
  { name: "Your Profile", href: "/profile" },
  { name: "Sign out", href: "/signin" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Navbar() {
  const userL = getUserInfo();
  const [user] = useState(userL || {});
  const { unreadCount } = useNotifications();
  const isAdmin = user?.user_role === "admin";

  const location = useLocation();
  return (
    <>
      <div className='min-h-full'>
        <Disclosure as='nav' className='bg-gray-800'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='flex h-16 items-center justify-between'>
              <div className='flex items-center'>
                <div className='shrink-0'>
                  <img
                    alt='Your Company'
                    src={logo}
                    className='size-8 mb-[5px]'
                  />
                </div>
                <div className='hidden md:block'>
                  <div className='ml-10 flex items-baseline space-x-4'>
                    {navigation.map((item, index) => (
                      <NavLink
                        state={{ from: location.pathname }}
                        key={item.name}
                        to={item.href}
                        aria-current={item.current ? "page" : undefined}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                        }
                      >
                        {item.name}
                      </NavLink>
                    ))}
                    <div className='relative group'>
                      <NavLink
                        state={{ from: location.pathname }}
                        to={"/reports/history"}
                        className={({ isActive }) =>
                          isActive ||
                          window.location.pathname === "/reports/saved"
                            ? "bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                        }
                      >
                        Reports
                      </NavLink>
                      {/* Submenu */}
                      <div className='absolute z-30 left-0 mt-[4px] hidden w-40 bg-gray-800 shadow-lg group-hover:flex flex-col'>
                        <div className='h-[5px] bg-#1f2937 w-[100%]'></div>
                        <NavLink
                          state={{ from: location.pathname }}
                          to='/reports/history'
                          className={({ isActive }) =>
                            isActive
                              ? "bg-gray-900 text-white ed-md  px-3 py-2 text-sm font-medium"
                              : "text-gray-300 hover:bg-gray-700  hover:text-white  px-3 py-2 text-sm font-medium"
                          }
                        >
                          My Reports
                        </NavLink>
                        <NavLink
                          state={{ from: location.pathname }}
                          to='/reports/saved'
                          className={({ isActive }) =>
                            isActive
                              ? "bg-gray-900 text-white  px-3 py-2 text-sm font-medium"
                              : "text-gray-300 hover:bg-gray-700  hover:text-white  px-3 py-2 text-sm font-medium"
                          }
                        >
                          Saved Reports
                        </NavLink>
                      </div>
                    </div>
                    {isAdmin && (
                      <NavLink
                        state={{ from: location.pathname }}
                        to='/admin/dashboard'
                        className={({ isActive }) =>
                          isActive
                            ? "bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                        }
                      >
                        Admin
                      </NavLink>
                    )}
                  </div>
                </div>
              </div>
              <div className='hidden md:block'>
                <div className='ml-4 flex items-center md:ml-6'>
                  <Link
                    to={"/notifications"}
                    type='button'
                    className='relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden'
                  >
                    <span className='absolute -inset-1.5' />
                    <span className='sr-only'>View notifications</span>
                    <BellIcon aria-hidden='true' className='size-6' />
                    {unreadCount > 0 && (
                      <span className='absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 min-w-[18px] h-[18px]'>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile dropdown */}
                  <Menu as='div' className='relative ml-3'>
                    <div>
                      <MenuButton className='relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm  focus:outline-hidden'>
                        <span className='absolute -inset-1.5' />
                        <span className='sr-only'>Open user menu</span>
                        <img
                          alt=''
                          src={user.avatar}
                          className='size-8 mt-2 rounded-full'
                        />
                      </MenuButton>
                    </div>
                    <MenuItems
                      transition
                      className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in'
                    >
                      {userNavigation.map((item) => (
                        <MenuItem key={item.name}>
                          <Link
                            onClick={() => {
                              item.name === "Sign out" && localStorage.clear();
                            }}
                            to={item.href}
                            className='block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden'
                          >
                            {item.name}
                          </Link>
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </div>
              </div>
              <div className='-mr-2 flex md:hidden'>
                {/* Mobile menu button */}
                <DisclosureButton className='group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden'>
                  <span className='absolute -inset-0.5' />
                  <span className='sr-only'>Open main menu</span>
                  <Bars3Icon
                    aria-hidden='true'
                    className='block size-6 group-data-open:hidden'
                  />
                  <XMarkIcon
                    aria-hidden='true'
                    className='hidden size-6 group-data-open:block'
                  />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className='md:hidden'>
            <div className='space-y-1 px-2 pt-2 pb-3 sm:px-3'>
              {navMobile.map((item, index) => (
                <Link
                  key={index}
                  aria-current={item.current ? "page" : undefined}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to='/admin/dashboard'
                  className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white'
                >
                  Admin
                </Link>
              )}
            </div>
            <div className='border-t border-gray-700 pt-4 pb-3'>
              <div className='flex items-center px-5'>
                <div className='shrink-0'>
                  <img
                    alt=''
                    src={user.avatar}
                    className='size-10 rounded-full'
                  />
                </div>
                <div className='ml-3'>
                  <div className='text-base/5 font-medium text-white'>
                    {user.username}
                  </div>
                  <div className='text-sm font-medium text-gray-400'>
                    {user.email}
                  </div>
                </div>
                <Link
                  to={"/notifications"}
                  type='button'
                  className='relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden'
                >
                  <span className='absolute -inset-1.5' />
                  <span className='sr-only'>View notifications</span>
                  <BellIcon aria-hidden='true' className='size-6' />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 min-w-[18px] h-[18px]'>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className='mt-3 space-y-1 px-2'>
                {userNavigation.map((item, index) => (
                  <Link
                    key={index}
                    aria-current={item.current ? "page" : undefined}
                    to={item.href}
                    className='block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white'
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>

        <div className=' min-w-[100%] max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default Navbar;
