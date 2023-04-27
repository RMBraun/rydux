import React, { useMemo } from 'react'

type Props = Record<string, unknown>

type StyledFunction<P = Props> = (props: P) => React.CSSProperties | undefined

type TagNames = keyof JSX.IntrinsicElements

type StyledComponent<Tag extends TagNames, P extends { css?: Props }> = React.FC<P & JSX.IntrinsicElements[Tag]> & {
  className: string | undefined
  styleFunction: StyledFunction<any>
}

function styled<Tag extends TagNames>(
  tagName: Tag,
  extendsFrom?: null | undefined,
  styleFunction?: null | undefined
): StyledComponent<Tag, { css?: undefined }>

function styled<Tag extends TagNames>(
  tagName: Tag,
  extendsFrom: string | Array<string | null | undefined>,
  styleFunction?: null | undefined
): StyledComponent<Tag, { css?: undefined }>

function styled<Tag extends TagNames, ExtendsCssProps extends { css?: Props }>(
  tagName: Tag,
  extendsFrom: StyledComponent<any, ExtendsCssProps>,
  styleFunction?: null | undefined
): StyledComponent<Tag, ExtendsCssProps['css'] extends undefined ? {} : ExtendsCssProps>

function styled<Tag extends TagNames, CssProps extends Props>(
  tagName: Tag,
  extendsFrom: string | Array<string | null | undefined>,
  styleFunction: StyledFunction<CssProps>
): StyledComponent<Tag, { css: CssProps }>

function styled<Tag extends TagNames, CssProps extends Props, ExtendsCssProps extends { css?: Props }>(
  tagName: Tag,
  extendsFrom: StyledComponent<any, ExtendsCssProps>,
  styleFunction: StyledFunction<CssProps>
): StyledComponent<
  Tag,
  ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
>

function styled<
  Tag extends TagNames,
  CssProps extends Props,
  ExtendsCssProps extends { css?: Props },
  ReturnElement extends StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >
>(
  tagName: Tag,
  extendsFrom?: string | StyledComponent<any, ExtendsCssProps> | Array<string | null | undefined> | null | undefined,
  styleFunction?: StyledFunction<CssProps> | null | undefined
): ReturnElement {
  if (typeof tagName !== 'string') {
    throw new Error('tagName must be a valid JSX element tag name')
  }

  if (
    extendsFrom != null &&
    typeof extendsFrom !== 'string' &&
    !(Array.isArray(extendsFrom) && extendsFrom.every((value) => value == null || typeof value === 'string')) &&
    !('styleFunction' in extendsFrom)
  ) {
    throw new Error('extendsFrom must be a String, StyledComponent, or Array<String>')
  }

  if (styleFunction != null && typeof styleFunction !== 'function') {
    throw new Error('styleFunction must be a function that returns React.CSSProperties')
  }

  const parentClassName =
    extendsFrom == null
      ? undefined
      : typeof extendsFrom === 'string'
      ? extendsFrom.trim()
      : Array.isArray(extendsFrom)
      ? Array.from(
          new Set(
            extendsFrom.flatMap((value) => value?.split(' ')?.map((value) => value.trim())).filter((value) => !!value)
          )
        ).join(' ')
      : extendsFrom.className

  const parentStyleFunction =
    extendsFrom == null ||
    typeof extendsFrom === 'string' ||
    Array.isArray(extendsFrom) ||
    extendsFrom.styleFunction == null
      ? null
      : extendsFrom.styleFunction

  const mergedStyleFunction = (css?: CssProps) =>
    css == null ? undefined : Object.assign({}, parentStyleFunction?.(css) ?? {}, styleFunction?.(css) ?? {})

  const component = React.forwardRef(function Styled(
    props: { css?: CssProps; className?: string; style: React.CSSProperties },
    ref
  ) {
    return React.createElement(tagName, {
      ...props,
      ref,
      className: useMemo(() => `${props.className || ''} ${parentClassName || ''}`.trim(), [props.className]),
      style: useMemo(() => mergedStyleFunction(props.css), [props.css]),
    })
  }) as unknown as ReturnElement

  component.className = parentClassName
  component.styleFunction = mergedStyleFunction

  return component
}

type Styled<Tag extends TagNames> = {
  (extendsFrom?: null | undefined, styleFunction?: null | undefined): StyledComponent<Tag, { css?: undefined }>

  <CssProps extends Props>(
    extendsFrom: string | Array<string | null | undefined>,
    styleFunction?: null | undefined
  ): StyledComponent<Tag, { css?: undefined }>

  <CssProps extends Props, ExtendsCssProps extends { css?: Props }>(
    extendsFrom: StyledComponent<any, ExtendsCssProps>,
    styleFunction?: null | undefined
  ): StyledComponent<Tag, ExtendsCssProps['css'] extends undefined ? {} : ExtendsCssProps>

  <CssProps extends Props>(
    extendsFrom: string | Array<string | null | undefined>,
    styleFunction: StyledFunction<CssProps>
  ): StyledComponent<Tag, { css: CssProps }>

  <CssProps extends Props, ExtendsCssProps extends { css?: Props }>(
    extendsFrom: StyledComponent<any, ExtendsCssProps>,
    styleFunction: StyledFunction<CssProps>
  ): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >

  <CssProps extends Props, ExtendsCssProps extends { css?: Props }>(
    extendsFrom?: string | StyledComponent<any, ExtendsCssProps> | Array<string | null | undefined> | null | undefined,
    styleFunction?: StyledFunction<CssProps> | null | undefined
  ): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >
}

const wrappedStyled = new Proxy(styled, {
  get(target, key) {
    return (...args: any[]) => target(key as TagNames, ...args)
  },
}) as typeof styled & {
  [K in keyof JSX.IntrinsicElements]: Styled<K>
}

export default wrappedStyled
