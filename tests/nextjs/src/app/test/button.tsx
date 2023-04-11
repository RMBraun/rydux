'use client'

import styles from './button.module.css'
import listen from '@rydux/listener'

import testReducer from '@rydux/test.reducer'
import { FullStore } from '@/rydux/rydux'
// import styled from '@emotion/styled'

import { styled } from '../../styled-css-modules'
import React, { useRef } from 'react'

const MyButton = styled('button', styles.buttonTest, (props: { deg: number; buttonId: number }) => ({
  padding: '10px',
  border: '2px solid white',
  background: props.buttonId % 2 === 0 ? `hsl(${props.deg.toString()} 100% 50%)` : 'blue',
}))

const IdAndCountText = styled('p', styles.textTest, (props: { test: string; ooga: string }) => ({
  color: props.test,
  fontSize: props.ooga,
  textDecoration: 'underline',
}))

const PlainText = styled('p', styles.textTest)

const InheritText = styled('p', IdAndCountText, (props: { test2: string }) => ({
  color: props.test2,
}))

const TestNoProps = styled('p')

const InheritText2 = styled('p', PlainText, (props: { fontStyle: string }) => ({
  fontStyle: props.fontStyle,
}))

export default listen<{ id: number }, { count: FullStore['test'][number] }>(
  (store, { id }) => ({ count: store.test[id] }),
  function Tile({ id, count }) {
    console.log(`rendering ${id}`)

    const ref = useRef<HTMLParagraphElement>(null)

    return (
      <MyButton
        css={{
          buttonId: id,
          deg: (count * 10) % 360,
        }}
        onClick={() => {
          console.log('test', id)
          testReducer.Actions.incCount({ id })
        }}
      >
        <IdAndCountText
          ref={ref}
          css={{
            test: 'magenta',
            ooga: '16px',
          }}
        >
          {`This is button ${id} - ${count}`}
        </IdAndCountText>
        <InheritText
          css={{
            test: 'cyan',
            test2: 'green',
            ooga: '30px',
          }}
          className={styles.textCustom}
        >
          {'test'}
        </InheritText>
        <InheritText2
          css={{
            fontStyle: 'italic',
          }}
        >
          {'should be italic'}
        </InheritText2>
        <TestNoProps>{'no props test'}</TestNoProps>
      </MyButton>
    )
  }
)
