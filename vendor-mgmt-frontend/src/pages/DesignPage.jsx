import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

export default function DesignPage(){
  const initialValues = { email: '', password: '' }
  const schema = Yup.object({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(6, 'Too short').required('Required'),
  })

  return (
    <div className="dx-page">
      <div className="dx-card">
        <div className="dx-visual" aria-hidden="true">
          <img src="/image.png" alt="Illustration" />
        </div>
        <div className="dx-form" role="main">
          <div className="dx-brand">
            <div className="dx-logo">DX</div>
            <h1>Welcome back</h1>
            <p>Sign in to continue to DevXcelerate</p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={(values, { setSubmitting }) => {
              setTimeout(() => {
                alert('Signed in: ' + JSON.stringify(values))
                setSubmitting(false)
              }, 600)
            }}
          >
            {({ isSubmitting }) => (
              <Form className="form">
                <label htmlFor="email">Email</label>
                <Field id="email" name="email" type="email" className="dx-input" />
                <ErrorMessage name="email" component="div" className="dx-error" />

                <label htmlFor="password">Password</label>
                <Field id="password" name="password" type="password" className="dx-input" />
                <ErrorMessage name="password" component="div" className="dx-error" />

                <button type="submit" className="dx-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing...' : 'Sign in'}
                </button>
              </Form>
            )}
          </Formik>

          <div className="dx-foot">Don't have an account? <a href="#">Sign up</a></div>
        </div>
      </div>
    </div>
  )
}
