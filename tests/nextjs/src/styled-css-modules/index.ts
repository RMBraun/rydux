import React from 'react'

type Props = Record<string, unknown>

type StyledFunction<P = Props> = (props: P) => React.CSSProperties

type TagNames = keyof JSX.IntrinsicElements

type StyledComponent<Tag extends TagNames, P extends { css?: Props }> = React.FC<P & JSX.IntrinsicElements[Tag]> & {
  _styled_className: string | null | undefined
  _styled_styleFunction: StyledFunction<P['css']> | null | undefined
}

export function styled<Tag extends TagNames>(
  tagName: Tag,
  extendsFrom?: null | undefined,
  styleFunction?: null | undefined
): StyledComponent<Tag, { css?: undefined }>

export function styled<Tag extends TagNames>(
  tagName: Tag,
  extendsFrom: string,
  styleFunction?: null | undefined
): StyledComponent<Tag, { css?: undefined }>

export function styled<Tag extends TagNames, ExtendsCssProps extends { css?: Props }>(
  tagName: Tag,
  extendsFrom: StyledComponent<any, ExtendsCssProps>,
  styleFunction?: null | undefined
): StyledComponent<Tag, ExtendsCssProps['css'] extends undefined ? { css?: undefined } : ExtendsCssProps>

export function styled<CssProps extends Props, Tag extends TagNames>(
  tagName: Tag,
  extendsFrom: string,
  styleFunction: StyledFunction<CssProps>
): StyledComponent<Tag, { css: CssProps }>

export function styled<CssProps extends Props, Tag extends TagNames, ExtendsCssProps extends { css?: Props }>(
  tagName: Tag,
  extendsFrom: StyledComponent<any, ExtendsCssProps>,
  styleFunction: StyledFunction<CssProps>
): StyledComponent<
  Tag,
  ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps } & ExtendsCssProps
>

export function styled<CssProps extends Props, Tag extends TagNames, ExtendsCssProps extends { css?: Props }>(
  tagName: Tag,
  extendsFrom?: string | StyledComponent<any, ExtendsCssProps> | null | undefined,
  styleFunction?: StyledFunction<CssProps> | null | undefined
): StyledComponent<
  Tag,
  ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps } & ExtendsCssProps
> {
  const parentClassName =
    extendsFrom == null || typeof extendsFrom === 'string' ? extendsFrom : extendsFrom._styled_className

  const parentStyleFunction =
    extendsFrom == null || typeof extendsFrom === 'string' ? undefined : extendsFrom._styled_styleFunction

  const component = React.forwardRef(function Styled(
    { css, ...props }: { css?: CssProps; className?: string; style: React.CSSProperties },
    ref
  ) {
    return React.createElement(tagName, {
      ...props,
      ref,
      className:
        props.className && parentClassName
          ? `${props.className} ${parentClassName}`
          : props.className ?? parentClassName,
      style: { ...(css && parentStyleFunction?.(css)), ...(css && styleFunction?.(css)), ...props.style },
    })
  }) as unknown as StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps } & ExtendsCssProps
  >

  // TODO might need to make this an array to hold history.. not sure if we can nest multiple times
  component._styled_className = parentClassName
  component._styled_styleFunction = styleFunction

  return component
}
