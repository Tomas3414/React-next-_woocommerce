import { BasicContainer, BasicGrid, SectionTitle } from '../styles/utils'
import { Category, Product } from '../types'
import Hero from '../components/Hero'
import { NextPage } from 'next'
import React from 'react'
import SingleCategory from '../components/Category'
import SingleProduct from '../components/Product/ProductCard'
import { fetcher } from '../utils/functions'
import PageTitle from '../components/PageTitle'

interface IndexPageProps {
  categories: Category[]
  featured: Product[]
}

const IndexPage: NextPage<IndexPageProps> = ({ categories, featured }) => {
  return (
    <>
      <PageTitle
        title="Woo Storefront | Next.Js"
        description="Unofficial WooCommerce Storefront theme made with Next.Js and Styled-components"
      />
      <Hero />

      <BasicContainer id="Categories">
        <SectionTitle>Shop by Category</SectionTitle>

        <BasicGrid lg={3} md={3} sm={2} xs={1}>
          {categories?.map((category: Category) => {
            return <SingleCategory key={category.id} category={category} />
          })}
        </BasicGrid>
        <SectionTitle>Featured Products</SectionTitle>
        <BasicGrid lg={4} md={3} sm={2} xs={1}>
          {featured?.map((product: Product) => {
            return (
              <React.Fragment key={product.id}>
                <SingleProduct product={product} />
              </React.Fragment>
            )
          })}
        </BasicGrid>
      </BasicContainer>
    </>
  )
}

export default IndexPage

export async function getStaticProps() {
  const categoriesRes = await fetcher(`/wp-json/wc/v3/products/categories`)
  const unfilteredCategories = await categoriesRes.json()

  const categories = unfilteredCategories.filter((item: Product) => {
    return item.name !== 'Uncategorized'
  })
  //Product query is capped to 100 per page.
  //Adjustment to WP code are needed to change it in case the shop has more than 100 products
  const productsRes = await fetcher(`/wp-json/wc/v3/products?per_page=100`)
  const products = await productsRes.json()

  const featured = products.filter((item: Product) => {
    if (item.featured === true && item.status === 'publish' && item.type === 'simple') {
      return item.featured
    } else {
      return null
    }
  })

  return {
    props: { categories, featured },
  }
}
