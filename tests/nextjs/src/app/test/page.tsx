import Button from './button'
import styles from './page.module.css'

const buttonIds = Array(100)
  .fill(null)
  .map((_, i) => i)

export default function Test() {
  return (
    <div className={styles.container}>
      <h1>{'this is my test page'}</h1>
      <div className={styles.grid}>
        {buttonIds.map((id) => (
          <Button key={id} id={id} />
        ))}
      </div>
    </div>
  )
}
