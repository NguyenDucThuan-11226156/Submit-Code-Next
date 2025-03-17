import React from 'react';
import { Dropdown } from 'antd';

const UserMenu = ({ user, onLogout, teacher }) => {
  return (
    <Dropdown
      menu={{
        items: [
          {
            key: '0',
            label: (
              <div className="fs-5">
                {teacher !== user?.uid && (<span className="text-primary user fw-bold">{user.displayName}</span>)}
              </div>
            ),
            disabled: true
          },
          {
            key: '1',
            label: (
              <div onClick={onLogout} className="fs-5">
                Đăng xuất
              </div>
            ),
          }
        ]
      }}
      placement="bottomRight"
      className={'z-3'}
    >
      <img
        id="avatar"
        src="/images/user.svg"
        width="38x"
        height="38x"
        className="user avatar rounded-circle dropdown-toggle"
        alt="user"
      />
    </Dropdown>
  );
};

export default UserMenu;
