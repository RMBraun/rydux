'use client'

import styles from './button.module.scss'
import listen from '@rydux/listener'

import testReducer from '@rydux/test.reducer'
import { FullStore } from '@rydux/rydux'

import { styled } from '@rybr/styled-modules'
import React, { CSSProperties, useContext, useRef } from 'react'
import { useTheme } from '@/styled-css-modules/theme'

const BaseButton = styled.button()

const MyButton = styled(BaseButton).$<{ deg: number; buttonId: number }>(styles.buttonTest, (props) => ({
  background:
    props.buttonId % 2 === 0
      ? `hsl(${(props.deg + 50).toString()} 100% 50%)`
      : `hsl(${(props.deg * 2).toString()} 100% 50%)`,
  _position: 'relative',
}))

const IdAndCountText = styled.p<{ test: string; fontSize: string }>(styles.textTest, (props) => ({
  color: props.test,
  fontSize: props.fontSize,
  textDecoration: 'underline',
}))

const PlainText = styled.p()

const InheritText = styled(IdAndCountText).p<{ test2: string }>(null, ({ test2 }) => ({
  color: test2,
}))

const TestNoProps = styled.p()

const InheritText2 = styled(PlainText).p<{ fontStyle: string }>(null, (props) => ({
  fontStyle: props.fontStyle,
  _color: 'darkred',
}))

const InheritText3 = styled(InheritText).p()

const InheritText4 = styled.p([
  styles.buttonTest,
  styles.textTest,
  styles.textTest,
  styles.textTest,
  styles.textTest,
  InheritText3.className,
])

const TestTest = styled(InheritText).p<{ test3: CSSProperties['color'] }>(null, ({ test3 }) => ({
  color: test3,
  position: 'relative',
}))

const FartTag = styled.fart(styles.textTest)

const AnimatedText = styled.p<{ speed: number }>(styles.text, ({ speed }) => ({
  animation: `${styles.textAnimation} ${500 * (speed ?? 1)}ms ease infinite`,
  textDecoration: 'underline',
}))

const VariableText = styled.p<{ color: CSSProperties['color'] }>(styles.variableText, ({ color }) => ({
  color,
  poop: 'test',
}))

const CustomTag = styled.oogaBooga<{ test: string }>('className', ({ test }) => ({}))

const CustomFunction: React.FC<{ ooga: string }> = (props) => {
  return <div>{props.ooga}</div>
}

const TestP = styled.p<{ test?: number }>('someClass', ({ test }) => ({
  background: test,
}))

const ExtendsTestP = styled(TestP).$<{ booga?: number }>('someOtherClass', ({ booga, test }) => ({
  height: booga,
}))

const DoubleExtendsTest = styled(ExtendsTestP).$<{ bob: string }>('lastClass', ({ bob, booga, test }) => ({
  color: bob,
}))

const TestFunc = () => {
  return (
    <>
      <TestP $test={4}>{'TestP'}</TestP>
      <ExtendsTestP $test={4}>{'ExtendsTestP'}</ExtendsTestP>
      <DoubleExtendsTest $bob={'blue'} $test={4}>
        {'DoubleExtendsTest'}
      </DoubleExtendsTest>
      {/* <CustomTag $test='string'>{'CustomTag'}</CustomTag> */}
    </>
  )
}

export default listen<{ id: number }, { count: FullStore['test'][number] }>(
  (store, { id }) => ({ count: store.test[id] }),
  function Tile({ id, count }) {
    const ref = useRef<HTMLParagraphElement>(null)

    const { css, themeId, setThemeId } = useTheme()

    return (
      <MyButton
        $buttonId={id}
        $deg={(count * 10) % 360}
        onClick={() => {
          setThemeId(themeId === 'light' ? 'dark' : 'light')
          testReducer.Actions.incCount({ id })
        }}
      >
        <TestFunc />
        <IdAndCountText ref={ref} $test={'magenta'} $fontSize={'16px'}>
          {`IdAndCountText ${id} - ${count}`}
        </IdAndCountText>
        <InheritText $test={'cyan'} $test2={'var(--test)'} $fontSize={'30px'} className={styles.textCustom}>
          {'InheritText'}
        </InheritText>
        <TestTest $test={'yellow'} $test2={'brown'} $test3={'lightblue'} $fontSize={'16px'}>
          {'InheritedText with wrapper'}
        </TestTest>
        <InheritText2 $fontStyle={'italic'}>{'InheritText2 - italic'}</InheritText2>
        <TestNoProps>{'TestNoProps - no props test'}</TestNoProps>
        <InheritText3 $fontSize={count + 'px'} $test={'purple'} $test2={'violet'}>
          {'InheritText3'}
        </InheritText3>
        <InheritText4>{'InheritText4'}</InheritText4>
        {/* <FartTag>{'Fart Tag'}</FartTag> */}
        <AnimatedText $speed={id % 10}>{'ANIMATED'}</AnimatedText>
        <VariableText $color={'yellow'}>{'this is some variable text'}</VariableText>
        <VariableText $color={'turquoise'}>{'this is MORE variable text'}</VariableText>
      </MyButton>
    )
  }
)
