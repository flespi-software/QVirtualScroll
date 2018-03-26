
export default [
  {
    path: '/',
    component: () => import('layouts/Index')
  },

  { // Always leave this as last one
    path: '*',
    component: () => import('pages/404')
  }
]
