"use client";
import React from 'react'

function AdminLayout({ children }: { children: React.ReactNode }) {

  return (
    <>
      <div className="admin-layout">
          {children}
      </div>
      
      
    </>
  )
}

export default AdminLayout
