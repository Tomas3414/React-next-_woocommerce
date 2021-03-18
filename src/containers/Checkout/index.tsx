import React, { useContext, useState, useRef } from 'react'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import { useForm } from 'react-hook-form'
import * as CheckoutPageStyles from './styled'
import AddressForm from '../../components/AddressForm'
import StripePayment from '../../components/StripePayment'
import OrderSummary from '../../components/OrderSummary'
import { BasicContainer, Loader, Subtitle } from '../../styles/utils'
import { CartContext } from '../../context/cart'
import { NextPage } from 'next'
import { createOrder, initCart } from '../../utils/functions'
import { Customer } from '../../types'
import { useRouter } from 'next/router'

interface CheckoutPageContainerProps {}

const CheckoutPageContainer: NextPage<CheckoutPageContainerProps> = () => {
  const [cart, setCart] = useContext(CartContext)
  const { register, handleSubmit, errors } = useForm()
  const [isProcessing, setIsProcessing] = useState(false)

  const [isReady, setIsReady] = useState(false)
  const [serverMsg, setServerMsg] = useState('')
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const onSubmit = async (customer: Customer) => {
    try {
      if (!cart.items) return
      setIsProcessing(true)
      let payment: any

      console.log(customer)

      //TODO: Add more payment methods (Paypal e.g)
      //Stripe block
      if (!stripe || !elements) throw new Error(`Stripe not initialized...`)

      const cardElement = elements.getElement('card')
      if (!cardElement) throw new Error(`No card element`)

      if (!isReady) {
        cardElement.focus()
        return
      }

      const stripeRes = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })
      if (!stripeRes.paymentMethod?.id) throw new Error(`Can't connect to Stripe...`)

      payment = stripeRes.paymentMethod.id
      // end of stripe block

      const { message } = await createOrder(customer, payment, cart)

      const newCart = await initCart()
      setCart(newCart)
      setIsProcessing(false)
      if (message === 'Success') {
        setServerMsg('Thank you for your order. Check your email for details!')
        setTimeout(() => {
          router.push('/')
        }, 5000)
      } else {
        setServerMsg('Sorry something went wrong. Please try again later...')
      }
    } catch (error) {
      console.log(error)
      setServerMsg('Sorry something went wrong. Please try again later...')
      const newCart = await initCart()
      setCart(newCart)
      setIsProcessing(false)
    }
  }

  return (
    <BasicContainer>
      <CheckoutPageStyles.Wrapper onSubmit={handleSubmit(onSubmit)}>
        <CheckoutPageStyles.Address>
          <Subtitle>Billing details</Subtitle>
          <AddressForm register={register} errors={errors} />
        </CheckoutPageStyles.Address>
        <CheckoutPageStyles.Order>
          <Subtitle>Your order</Subtitle>
          <OrderSummary register={register} errors={errors} />
        </CheckoutPageStyles.Order>
        <CheckoutPageStyles.Payment>
          <Subtitle>Pay with credit card</Subtitle>
          <StripePayment isReady={isReady} setIsReady={setIsReady} />
        </CheckoutPageStyles.Payment>
        <CheckoutPageStyles.SubmitHolder>
          <CheckoutPageStyles.PrivacyNotice>
            Your personal data will be used to process your order, support your experience
            throughout this website, and for other purposes described in our privacy policy.
          </CheckoutPageStyles.PrivacyNotice>
          <CheckoutPageStyles.PlaceOrderBtn disabled={isProcessing} type="submit">
            {isProcessing ? <Loader /> : 'Place Order'}
          </CheckoutPageStyles.PlaceOrderBtn>
          <CheckoutPageStyles.ServerMessage>{serverMsg}</CheckoutPageStyles.ServerMessage>
        </CheckoutPageStyles.SubmitHolder>
      </CheckoutPageStyles.Wrapper>
    </BasicContainer>
  )
}

export default CheckoutPageContainer
