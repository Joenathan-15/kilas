.PHONY: db backend frontend

backend:
	cd backend && go run .

frontend:
	cd frontend && npm run dev
