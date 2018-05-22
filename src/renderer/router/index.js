import Vue from 'vue'
import Router from 'vue-router'
import jQuery from 'jquery'
global.jQuery = jQuery
global.$ = jQuery
Vue.use(Router);

import { Typeahead } from 'uiv';

import * as uiv from 'uiv';
Vue.use(uiv, {prefix: 'uiv'})
export const bus = new Vue();


export default new Router({
  routes: [
    {
      path: '/',
      name: 'welcome-view',
      component: require('@/components/WelcomeView').default
    },
    {
      path: '/inspire',
      name: 'inspire',
      component: require('@/components/InspireView').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})