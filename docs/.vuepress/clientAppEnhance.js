import Dataset from '@/Dataset.vue'
import DatasetSearch from '@/DatasetSearch.vue'
import DatasetShow from '@/DatasetShow.vue'
import DatasetPager from '@/DatasetPager.vue'
import DatasetItem from '@/DatasetItem.vue'
import DatasetInfo from '@/DatasetInfo.vue'
import './styles/styles.scss'

import { defineClientAppEnhance } from '@vuepress/client'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  app.component('Dataset', Dataset)
  app.component('DatasetShow', DatasetShow)
  app.component('DatasetSearch', DatasetSearch)
  app.component('DatasetPager', DatasetPager)
  app.component('DatasetItem', DatasetItem)
  app.component('DatasetInfo', DatasetInfo)
})
