# Permissions

Role-based access matrix for the Module Library Platform API.

Roles: `admin`, `maintainer`, `developer`. `public` means no authentication required.

| Action            | Public | Developer | Maintainer | Admin |
| ----------------- | :----: | :-------: | :--------: | :---: |
| Register / Login  |   ✅   |     —     |     —      |   —   |
| View own profile  |   —    |    ✅     |     ✅     |  ✅   |
| View all users    |   —    |     —     |     —      |  ✅   |
| Change user role  |   —    |     —     |     —      |  ✅   |
| Create module     |   —    |     —     |     ✅     |  ✅   |
| View modules      |   —    |    ✅     |     ✅     |  ✅   |
| Update own module |   —    |     —     | ✅ (owner) |  ✅   |
| Submit for review |   —    |     —     | ✅ (owner) |   —   |
| Approve / reject  |   —    |     —     |     —      |  ✅   |
| Add version       |   —    |     —     | ✅ (owner) |  ✅   |
| View versions     |   —    |    ✅     |     ✅     |  ✅   |
| Download approved |   —    |    ✅     |     ✅     |  ✅   |

Notes:

- `owner` means the user must also be the maintainer who created the module.
- `admin` overrides ownership checks where it makes sense (e.g. updating any module).
