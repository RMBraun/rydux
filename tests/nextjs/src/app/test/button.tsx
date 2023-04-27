'use client'

import styles from './button.module.css'
import listen from '@rydux/listener'

import testReducer from '@rydux/test.reducer'
import { FullStore } from '@rydux/rydux'

import styled from '@styled'
import React, { CSSProperties, useRef } from 'react'

const MyButton = styled('button', styles.buttonTest, (props: { deg: number; buttonId: number }) => ({
  padding: '10px',
  border: '2px solid white',
  background: props.buttonId % 2 === 0 ? `hsl(${props.deg.toString()} 100% 50%)` : 'blue',
}))

const IdAndCountText = styled('p', styles.textTest, (props: { test: string; fontSize: string }) => ({
  color: props.test,
  fontSize: props.fontSize,
  textDecoration: 'underline',
}))

const PlainText = styled('p')

const InheritText = styled('p', IdAndCountText, (props: { test2: string }) => ({
  color: props.test2,
}))

const TestNoProps = styled('p')

const InheritText2 = styled('p', PlainText, (props: { fontStyle: string }) => ({
  fontStyle: props.fontStyle,
}))

const InheritText3 = styled('p', InheritText)

const InheritText4 = styled('p', [
  styles.buttonTest,
  styles.textTest,
  styles.textTest,
  styles.textTest,
  styles.textTest,
  InheritText3.className,
])

const TestTest = styled.p(InheritText, (props: { test3: CSSProperties['color'] }) => ({
  color: props.test3,
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
            fontSize: '16px',
          }}
        >
          {`IdAndCountText ${id} - ${count}`}
        </IdAndCountText>
        <InheritText
          css={{
            test: 'cyan',
            test2: 'green',
            fontSize: '30px',
          }}
          className={styles.textCustom}
        >
          {'InheritText'}
        </InheritText>
        <TestTest
          css={{
            test: 'yellow',
            test2: 'brown',
            test3: 'lightblue',
            fontSize: '16px',
          }}
        >
          {'InheritedText with wrapper'}
        </TestTest>
        <InheritText2
          css={{
            fontStyle: 'italic',
          }}
        >
          {'InheritText2 - italic'}
        </InheritText2>
        <TestNoProps>{'TestNoProps - no props test'}</TestNoProps>
        <InheritText3
          css={{
            fontSize: count + 'px',
            test: 'purple',
            test2: 'violet',
          }}
        >
          {'InheritText3'}
        </InheritText3>
        <InheritText4>{'InheritText4'}</InheritText4>
      </MyButton>
    )
  }
)
