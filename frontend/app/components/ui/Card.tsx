const React = {} as any
export function Card({children, className=""}:{children:any,className?:string}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface/90 backdrop-blur-md shadow-elevate ${className}`}>
      {children}
    </div>
  )
}
