import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export const DropdownMenu = ({ children }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {children}
    </Menu>
  );
};

export const DropdownMenuTrigger = ({ children }) => {
  return (
    <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      {children}
    </Menu.Button>
  );
};

export const DropdownMenuContent = ({ children, align = 'right' }) => {
  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        className={`origin-top-${align} absolute ${align}-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none`}
      >
        {children}
      </Menu.Items>
    </Transition>
  );
};

export const DropdownMenuItem = ({ children, onClick }) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={onClick}
          className={`${
            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
          } group flex items-center w-full px-2 py-2 text-sm`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
};

export const DropdownMenuLabel = ({ children }) => {
  return (
    <div className="px-4 py-2 text-sm text-gray-700">
      {children}
    </div>
  );
};

export const DropdownMenuSeparator = () => {
  return <div className="border-t border-gray-100 my-1" />;
};
