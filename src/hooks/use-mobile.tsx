import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Siempre retornar true para forzar sidebar como overlay
  return true;
  
  /* Código original comentado - descomentar para restaurar comportamiento responsive
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
  */
}
