import React, { CSSProperties } from 'react'

//TODO rewrite so that extendsFrom is chained
// styled(...extendsFrom: Array<StyledComponent | string | undefined | null>).tagName((cssProps) => React.CSSProperties)

type CSSPropertyKeys = keyof React.CSSProperties

type RawCSSProperties = {
  [K in `_${CSSPropertyKeys}`]?: K extends `_${infer CssName}`
    ? CssName extends CSSPropertyKeys
      ? CSSProperties[CssName]
      : never
    : never
}

type Props = Record<string, unknown>

type StyledFunction<P = Props> = (props: P) => (CSSProperties & RawCSSProperties & Record<string, unknown>) | undefined

type TagNames = keyof JSX.IntrinsicElements

type CustomTag = string

type BasicElementAttributes = { id?: string; children?: React.ReactNode }

type StyledComponent<Tag extends CustomTag | TagNames, P extends { css?: Props }> = React.FC<
  P & (Tag extends TagNames ? JSX.IntrinsicElements[Tag] : BasicElementAttributes)
> & {
  className: string | undefined
  styleFunction: StyledFunction<any>
}

type Styled<Tag extends string = CustomTag> = {
  (): StyledComponent<Tag, {}>

  (extendsFrom: string | Array<StyledComponent<any, any> | string | null | undefined>): StyledComponent<
    Tag,
    { css?: undefined }
  >

  <ExtendsCssProps extends { css?: Props }>(extendsFrom: StyledComponent<any, ExtendsCssProps>): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? {} : ExtendsCssProps
  >

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
    extendsFrom?:
      | string
      | StyledComponent<any, ExtendsCssProps>
      | Array<StyledComponent<any, any> | string | null | undefined>
      | null
      | undefined,
    styleFunction?: StyledFunction<CssProps> | null | undefined
  ): StyledComponent<
    Tag,
    ExtendsCssProps['css'] extends undefined ? { css: CssProps } : { css: CssProps & ExtendsCssProps['css'] }
  >
}

const getMergedStyleFunction =
  (funcs: Array<StyledFunction<any> | undefined | null>) =>
  (css?: Props): Record<string, unknown> =>
    Object.assign({}, ...funcs.map((func) => func?.(css) ?? {}))

function createdStyledComponent(
  tagName: string,
  extendsFrom?:
    | string
    | StyledComponent<any, any>
    | Array<StyledComponent<any, any> | string | null | undefined>
    | null
    | undefined,
  styleFunction?: StyledFunction<any> | null | undefined
) {
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
    throw new Error('styleFunction must be a function that returns CSSProperties')
  }

  const parentClassName =
    extendsFrom == null
      ? undefined
      : typeof extendsFrom === 'string'
      ? extendsFrom.trim()
      : Array.isArray(extendsFrom)
      ? Array.from(
          new Set(
            extendsFrom
              .filter((value): value is string => typeof value === 'string')
              .flatMap((value) => value?.split(' ')?.map((value) => value.trim()))
              .filter((value) => !!value)
          )
        ).join(' ')
      : extendsFrom.className

  const parentStyleFunction =
    extendsFrom == null || typeof extendsFrom === 'string'
      ? null
      : Array.isArray(extendsFrom)
      ? getMergedStyleFunction(
          extendsFrom
            .filter(
              (value): value is StyledComponent<any, any> =>
                value != null && typeof value !== 'string' && value.styleFunction != null
            )
            .map((value) => value.styleFunction)
        )
      : extendsFrom.styleFunction

  const mergedStyleFunction = getMergedStyleFunction([parentStyleFunction, styleFunction])

  const component = React.memo(
    React.forwardRef(function Styled(props: { css?: Props; className?: string; style: CSSProperties }, ref) {
      const { css, className, style, ...rest } = props

      return React.createElement(tagName, {
        ...rest,
        ref,
        className: React.useMemo(() => `${className || ''} ${parentClassName || ''}`.trim(), [className]),
        style: React.useMemo(
          () =>
            Object.fromEntries(
              Object.entries(mergedStyleFunction(css)).map(([key, value]) => [
                key.startsWith('_') ? key.slice(1) : `--${key}`,
                value,
              ])
            ),
          [css]
        ),
      })
    })
  ) as unknown as StyledComponent<string, any>

  component.className = parentClassName
  component.styleFunction = mergedStyleFunction

  return component
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new Proxy(
  {} as {
    [K in keyof JSX.IntrinsicElements]: Styled<K>
  } & { [K in string]: Styled<K> },
  {
    get(_, key: string) {
      return (...args: any[]) => createdStyledComponent(key, ...args)
    },
  }
)
