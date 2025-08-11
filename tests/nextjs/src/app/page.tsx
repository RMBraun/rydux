import { CountReducer } from '@reducers/CountReducer'
import { UpdateSlice } from '@rybr/rydux/server'
import { CousinComponent } from './_components/CousinComponent'
import { MainComponent } from './_components/MainComponent'
import { ServerComponent } from './_components/ServerComponent'
import styles from './page.module.css'

export default function Home() {
  console.log('page.tsx', typeof window === 'undefined', CountReducer.__rydux_instance_ID)

  return (
    <>
      <UpdateSlice
        reducer={CountReducer}
        state={{ test: 'test-server', count: 98, ooga: { booga: 'a' }, cousinOnly: 10 }}
      >
        <div className={styles.page}>
          <main className={styles.main}>
            <div className={styles.ctas}>
              <CousinComponent />
              <MainComponent />
              <ServerComponent />
            </div>
          </main>
        </div>
      </UpdateSlice>
    </>
  )
}
