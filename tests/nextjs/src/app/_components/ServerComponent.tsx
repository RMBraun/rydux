import { CountReducer } from '@reducers/CountReducer'

export const ServerComponent: React.FC = async () => {
  const slice = CountReducer.getSlice()

  console.log('render-ServerComponent.tsx')

  return (
    <div className={'container'}>
      <p className={'title'}>{'SERVER COMPONENT'}</p>
      <pre>{JSON.stringify(slice, null, 2)}</pre>
    </div>
  )
}
